import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ContactStatus, Prisma, UserRole } from '@prisma/client';
import * as XLSX from 'xlsx';

import { JwtPayload } from '../auth/jwt.payload';
import { isValidBrazilPhoneWithDDI55, normalizeBrazilPhone } from '../common/phone';
import { PrismaService } from '../prisma/prisma.service';

type ImportRow = { name: string; phone: string; tag?: string };

function parseExcel(buffer: Buffer): ImportRow[] {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];

  const sheet = wb.Sheets[sheetName];
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  return rows.map((r) => ({
    name: String(r['NOME'] ?? r['Nome'] ?? r['name'] ?? r['NAME'] ?? '').trim(),
    phone: String(r['TELEFONE'] ?? r['Telefone'] ?? r['phone'] ?? r['PHONE'] ?? '').trim(),
    tag: String(r['ETIQUETA'] ?? r['Etiqueta'] ?? r['tag'] ?? r['TAG'] ?? '').trim() || undefined,
  }));
}

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  private assertAccess(user: JwtPayload, ownerUserId: string) {
    if (user.role !== UserRole.ADMIN && user.sub !== ownerUserId) {
      throw new ForbiddenException('Acesso negado');
    }
  }

  async list(user: JwtPayload, filters: { userId?: string; status?: ContactStatus; tag?: string; q?: string }) {
    const where: Prisma.ContactWhereInput = {
      userId: user.role === UserRole.ADMIN ? filters.userId : user.sub,
      status: filters.status,
      tag: filters.tag,
      OR: filters.q
        ? [
            { name: { contains: filters.q, mode: 'insensitive' } },
            { phone: { contains: filters.q } },
          ]
        : undefined,
    };

    return this.prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 2000,
    });
  }

  async get(user: JwtPayload, id: string) {
    const c = await this.prisma.contact.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Contato não encontrado');
    this.assertAccess(user, c.userId);
    return c;
  }

  async create(user: JwtPayload, data: { userId: string; name: string; phone: string; tag?: string; optIn: boolean; status: ContactStatus }) {
    this.assertAccess(user, data.userId);
    const normalized = normalizeBrazilPhone(data.phone);
    if (!isValidBrazilPhoneWithDDI55(normalized)) {
      throw new BadRequestException('Telefone inválido (exija DDI 55 + DDD + número)');
    }

    return this.prisma.contact.upsert({
      where: { userId_phone: { userId: data.userId, phone: normalized } },
      create: {
        userId: data.userId,
        name: data.name,
        phone: normalized,
        tag: data.tag,
        optIn: data.optIn,
        status: data.status,
        source: 'MANUAL',
      },
      update: {
        name: data.name,
        tag: data.tag,
        optIn: data.optIn,
        status: data.status,
      },
    });
  }

  async update(user: JwtPayload, id: string, data: Partial<{ name: string; tag: string | null; optIn: boolean; status: ContactStatus }>) {
    const c = await this.get(user, id);
    return this.prisma.contact.update({
      where: { id },
      data: { ...data, tag: data.tag === null ? null : data.tag },
    });
  }

  async markOptOut(user: JwtPayload, id: string) {
    const c = await this.get(user, id);
    return this.prisma.contact.update({
      where: { id: c.id },
      data: { status: ContactStatus.OPTOUT, optIn: false, optOutAt: new Date() },
    });
  }

  async exportCsv(user: JwtPayload, userId?: string) {
    const contacts = await this.list(user, { userId, status: undefined, tag: undefined, q: undefined });
    const header = ['NOME', 'TELEFONE', 'ETIQUETA', 'OPT_IN', 'STATUS'];
    const lines = [header.join(',')];
    for (const c of contacts) {
      lines.push(
        [
          JSON.stringify(c.name ?? ''),
          JSON.stringify(c.phone ?? ''),
          JSON.stringify(c.tag ?? ''),
          JSON.stringify(c.optIn ? 'true' : 'false'),
          JSON.stringify(c.status),
        ].join(','),
      );
    }
    return lines.join('\n');
  }

  async importExcel(user: JwtPayload, params: { userId: string; fileBuffer: Buffer; confirmOptIn: boolean; source?: string }) {
    this.assertAccess(user, params.userId);
    if (!params.confirmOptIn) {
      throw new BadRequestException('Confirmação de opt-in é obrigatória para importação');
    }

    const rows = parseExcel(params.fileBuffer);
    if (!rows.length) throw new BadRequestException('Planilha vazia ou inválida (colunas: NOME, TELEFONE, ETIQUETA)');

    let created = 0;
    let updated = 0;
    let invalid = 0;
    let skipped = 0;

    for (const row of rows) {
      const name = (row.name ?? '').trim();
      const phoneNormalized = normalizeBrazilPhone(row.phone);
      if (!name || !isValidBrazilPhoneWithDDI55(phoneNormalized)) {
        invalid++;
        continue;
      }

      const existing = await this.prisma.contact.findUnique({
        where: { userId_phone: { userId: params.userId, phone: phoneNormalized } },
      });

      if (!existing) {
        await this.prisma.contact.create({
          data: {
            userId: params.userId,
            name,
            phone: phoneNormalized,
            tag: row.tag,
            optIn: true,
            status: ContactStatus.ACTIVE,
            source: params.source ?? 'EXCEL',
          },
        });
        created++;
      } else {
        // Atualiza tag/nome e mantém opt-out se já ocorreu
        if (existing.status === ContactStatus.OPTOUT) {
          skipped++;
          continue;
        }
        await this.prisma.contact.update({
          where: { id: existing.id },
          data: {
            name,
            tag: row.tag ?? existing.tag,
            optIn: true,
            status: existing.status === ContactStatus.INACTIVE ? ContactStatus.ACTIVE : existing.status,
            source: existing.source ?? params.source ?? 'EXCEL',
          },
        });
        updated++;
      }
    }

    return { total: rows.length, created, updated, invalid, skipped };
  }
}

