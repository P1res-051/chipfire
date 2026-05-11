import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  ContentGroupType,
  ContentSelectionMode,
  ContentStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import type { Express } from 'express';
import * as XLSX from 'xlsx';

import type { JwtPayload } from '../auth/jwt.payload';
import { slugify } from '../common/slug';
import { PrismaService } from '../prisma/prisma.service';

type ImportRowError = {
  line: number;
  message: string;
  raw: Record<string, any>;
};

type ImportReport = {
  totalLines: number;
  createdGroups: number;
  createdItems: number;
  ignoredItems: number;
  errors: number;
  errorDetails: ImportRowError[];
};

@Injectable()
export class ContentGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  private assertAdmin(user: JwtPayload) {
    if (String(user.role) !== String(UserRole.ADMIN)) {
      throw new BadRequestException('Apenas ADMIN pode gerenciar Content Groups.');
    }
  }

  private async ensureUniqueSlug(params: {
    createdById: string;
    desiredSlug: string;
    excludeId?: string;
  }) {
    const base = slugify(params.desiredSlug);
    if (!base) throw new BadRequestException('Slug inválido.');

    let candidate = base;
    for (let i = 0; i < 50; i++) {
      const existing = await this.prisma.contentGroup.findFirst({
        where: {
          createdById: params.createdById,
          slug: candidate,
          ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
        },
        select: { id: true },
      });
      if (!existing) return candidate;
      candidate = `${base}-${i + 2}`;
    }

    throw new BadRequestException('Não foi possível gerar um slug único.');
  }

  async list(user: JwtPayload) {
    this.assertAdmin(user);
    return this.prisma.contentGroup.findMany({
      where: { createdById: user.sub },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { items: true } } },
    });
  }

  async get(user: JwtPayload, id: string) {
    this.assertAdmin(user);
    const group = await this.prisma.contentGroup.findFirst({
      where: { id, createdById: user.sub },
      include: { _count: { select: { items: true } } },
    });
    if (!group) throw new NotFoundException('Grupo não encontrado.');
    return group;
  }

  async create(
    user: JwtPayload,
    dto: {
      name: string;
      slug?: string;
      description?: string;
      type: ContentGroupType;
      selectionMode: ContentSelectionMode;
      status: ContentStatus;
    },
  ) {
    this.assertAdmin(user);

    const slug = await this.ensureUniqueSlug({
      createdById: user.sub,
      desiredSlug: dto.slug ?? dto.name,
    });

    return this.prisma.contentGroup.create({
      data: {
        createdById: user.sub,
        name: dto.name,
        slug,
        description: dto.description ?? null,
        type: dto.type,
        selectionMode: dto.selectionMode,
        status: dto.status,
      },
    });
  }

  async update(
    user: JwtPayload,
    id: string,
    dto: Partial<{
      name: string;
      slug: string;
      description: string | null;
      type: ContentGroupType;
      selectionMode: ContentSelectionMode;
      status: ContentStatus;
    }>,
  ) {
    this.assertAdmin(user);
    const existing = await this.prisma.contentGroup.findFirst({
      where: { id, createdById: user.sub },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Grupo não encontrado.');

    const data: Prisma.ContentGroupUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.selectionMode !== undefined) data.selectionMode = dto.selectionMode;
    if (dto.status !== undefined) data.status = dto.status;

    if (dto.slug !== undefined) {
      data.slug = await this.ensureUniqueSlug({
        createdById: user.sub,
        desiredSlug: dto.slug,
        excludeId: id,
      });
    }

    return this.prisma.contentGroup.update({
      where: { id },
      data,
    });
  }

  async remove(user: JwtPayload, id: string) {
    this.assertAdmin(user);
    const existing = await this.prisma.contentGroup.findFirst({
      where: { id, createdById: user.sub },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Grupo não encontrado.');

    await this.prisma.contentGroup.delete({ where: { id } });
    return { success: true };
  }

  async listItems(user: JwtPayload, groupId: string) {
    this.assertAdmin(user);
    const group = await this.prisma.contentGroup.findFirst({
      where: { id: groupId, createdById: user.sub },
      select: { id: true },
    });
    if (!group) throw new NotFoundException('Grupo não encontrado.');

    return this.prisma.contentGroupItem.findMany({
      where: { groupId },
      orderBy: [{ createdAt: 'desc' }],
      include: { media: true },
    });
  }

  private async assertMediaOwnership(userId: string, mediaId: string) {
    const media = await this.prisma.mediaLibrary.findFirst({
      where: { id: mediaId, userId },
      select: { id: true },
    });
    if (!media) throw new BadRequestException('Mídia não encontrada para este usuário.');
  }

  private validateItemPayload(groupType: ContentGroupType, dto: { type: ContentGroupType; textContent?: string | null; mediaId?: string | null }) {
    if (dto.type === ContentGroupType.MIXED) {
      throw new BadRequestException('Item não pode ter tipo MIXED.');
    }
    if (groupType !== ContentGroupType.MIXED && dto.type !== groupType) {
      throw new BadRequestException('Tipo do item não é compatível com o tipo do grupo.');
    }
    if (dto.type === ContentGroupType.TEXT) {
      if (!dto.textContent || !String(dto.textContent).trim()) {
        throw new BadRequestException('textContent é obrigatório para itens TEXT.');
      }
    } else {
      if (!dto.mediaId) {
        throw new BadRequestException('mediaId é obrigatório para itens de mídia.');
      }
    }
  }

  async createItem(
    user: JwtPayload,
    groupId: string,
    dto: {
      type: ContentGroupType;
      textContent?: string;
      mediaId?: string;
      weight: number;
      status: ContentStatus;
    },
  ) {
    this.assertAdmin(user);

    const group = await this.prisma.contentGroup.findFirst({
      where: { id: groupId, createdById: user.sub },
      select: { id: true, type: true },
    });
    if (!group) throw new NotFoundException('Grupo não encontrado.');

    this.validateItemPayload(group.type, dto);
    if (dto.mediaId) await this.assertMediaOwnership(user.sub, dto.mediaId);

    // Evitar duplicar item idêntico no mesmo grupo
    const duplicate = await this.prisma.contentGroupItem.findFirst({
      where: {
        groupId,
        type: dto.type,
        ...(dto.type === ContentGroupType.TEXT
          ? { textContent: dto.textContent }
          : { mediaId: dto.mediaId }),
      },
      select: { id: true },
    });
    if (duplicate) return { ignored: true, reason: 'DUPLICATE', id: duplicate.id };

    return this.prisma.contentGroupItem.create({
      data: {
        group: { connect: { id: groupId } },
        type: dto.type,
        textContent: dto.type === ContentGroupType.TEXT ? dto.textContent : null,
        ...(dto.type !== ContentGroupType.TEXT && dto.mediaId
          ? { media: { connect: { id: dto.mediaId } } }
          : {}),
        weight: dto.weight,
        status: dto.status,
      },
      include: { media: true },
    });
  }

  async updateItem(
    user: JwtPayload,
    groupId: string,
    itemId: string,
    dto: Partial<{
      type: ContentGroupType;
      textContent: string | null;
      mediaId: string | null;
      weight: number;
      status: ContentStatus;
    }>,
  ) {
    this.assertAdmin(user);

    const group = await this.prisma.contentGroup.findFirst({
      where: { id: groupId, createdById: user.sub },
      select: { id: true, type: true },
    });
    if (!group) throw new NotFoundException('Grupo não encontrado.');

    const item = await this.prisma.contentGroupItem.findFirst({
      where: { id: itemId, groupId },
      select: { id: true, type: true },
    });
    if (!item) throw new NotFoundException('Item não encontrado.');

    const mergedType = dto.type ?? item.type;
    const mergedText = dto.textContent === undefined ? undefined : dto.textContent;
    const mergedMediaId = dto.mediaId === undefined ? undefined : dto.mediaId;

    this.validateItemPayload(group.type, {
      type: mergedType,
      textContent: mergedText ?? undefined,
      mediaId: mergedMediaId ?? undefined,
    });
    if (mergedType !== ContentGroupType.TEXT && mergedMediaId) {
      await this.assertMediaOwnership(user.sub, mergedMediaId);
    }

    const data: Prisma.ContentGroupItemUncheckedUpdateInput = {};
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.textContent !== undefined) data.textContent = dto.textContent;
    if (dto.mediaId !== undefined) data.mediaId = dto.mediaId;
    if (dto.weight !== undefined) data.weight = dto.weight;
    if (dto.status !== undefined) data.status = dto.status;

    return this.prisma.contentGroupItem.update({
      where: { id: itemId },
      data,
      include: { media: true },
    });
  }

  async removeItem(user: JwtPayload, groupId: string, itemId: string) {
    this.assertAdmin(user);
    const group = await this.prisma.contentGroup.findFirst({
      where: { id: groupId, createdById: user.sub },
      select: { id: true },
    });
    if (!group) throw new NotFoundException('Grupo não encontrado.');

    const item = await this.prisma.contentGroupItem.findFirst({
      where: { id: itemId, groupId },
      select: { id: true },
    });
    if (!item) throw new NotFoundException('Item não encontrado.');

    await this.prisma.contentGroupItem.delete({ where: { id: itemId } });
    return { success: true };
  }

  private isItemUsable(item: { type: ContentGroupType; textContent: string | null; mediaId: string | null }) {
    if (item.type === ContentGroupType.TEXT) return !!(item.textContent && item.textContent.trim());
    return !!item.mediaId;
  }

  private pickWeightedRandom<T extends { weight: number }>(items: T[]) {
    const total = items.reduce((acc, it) => acc + Math.max(1, it.weight ?? 1), 0);
    let r = Math.random() * total;
    for (const it of items) {
      r -= Math.max(1, it.weight ?? 1);
      if (r <= 0) return it;
    }
    return items[items.length - 1];
  }

  async testResolve(user: JwtPayload, groupId: string, dryRun = true) {
    this.assertAdmin(user);

    const group = await this.prisma.contentGroup.findFirst({
      where: { id: groupId, createdById: user.sub },
      select: { id: true, selectionMode: true, status: true },
    });
    if (!group) throw new NotFoundException('Grupo não encontrado.');
    if (group.status !== ContentStatus.ACTIVE) {
      throw new BadRequestException('Grupo INATIVO.');
    }

    return this.prisma.$transaction(async (tx) => {
      const items = await tx.contentGroupItem.findMany({
        where: { groupId, status: ContentStatus.ACTIVE },
        orderBy: [{ createdAt: 'asc' }],
        include: { media: true },
      });

      const usable = items.filter((i) => this.isItemUsable(i));
      if (!usable.length) {
        throw new BadRequestException('Nenhum item ativo e válido para resolver.');
      }

      let picked = usable[0];
      switch (group.selectionMode) {
        case ContentSelectionMode.RANDOM:
          picked = usable[Math.floor(Math.random() * usable.length)];
          break;
        case ContentSelectionMode.WEIGHTED_RANDOM:
          picked = this.pickWeightedRandom(usable);
          break;
        case ContentSelectionMode.LEAST_USED:
          picked = [...usable].sort((a, b) => {
            if (a.usageCount !== b.usageCount) return a.usageCount - b.usageCount;
            const aTime = a.lastUsedAt ? a.lastUsedAt.getTime() : 0;
            const bTime = b.lastUsedAt ? b.lastUsedAt.getTime() : 0;
            return aTime - bTime;
          })[0];
          break;
        case ContentSelectionMode.SEQUENTIAL:
        default:
          picked = [...usable].sort((a, b) => {
            const aTime = a.lastUsedAt ? a.lastUsedAt.getTime() : 0;
            const bTime = b.lastUsedAt ? b.lastUsedAt.getTime() : 0;
            return aTime - bTime;
          })[0];
          break;
      }

      // Se dryRun=true (preview), NÃO atualizar estatísticas
      // Se dryRun=false (resolve real), incrementar usageCount e lastUsedAt
      let updated = picked;
      if (!dryRun) {
        updated = await tx.contentGroupItem.update({
          where: { id: picked.id },
          data: { usageCount: { increment: 1 }, lastUsedAt: new Date() },
          include: { media: true },
        });
      } else {
        // Em modo dryRun, fazer refetch para garantir data consistente
        updated = await tx.contentGroupItem.findUnique({
          where: { id: picked.id },
          include: { media: true },
        }) as any;
      }

      return {
        success: true,
        item: updated,
      };
    });
  }

  private normalizeHeaderKey(key: string) {
    return String(key ?? '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_');
  }

  async importXlsx(user: JwtPayload, file: Express.Multer.File): Promise<ImportReport> {
    this.assertAdmin(user);
    if (!file) throw new BadRequestException('Arquivo não enviado.');
    if (!file.buffer?.length) throw new BadRequestException('Arquivo inválido.');

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames?.[0];
    if (!sheetName) throw new BadRequestException('Planilha vazia.');
    const sheet = workbook.Sheets[sheetName];

    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
    const max = 5000;
    const rows = rawRows.slice(0, max);

    const errors: ImportRowError[] = [];
    const parsed = rows.map((r, idx) => {
      const normalized: Record<string, any> = {};
      for (const [k, v] of Object.entries(r)) normalized[this.normalizeHeaderKey(k)] = v;
      return { line: idx + 2, raw: normalized };
    });

    const groupSlugSet = new Set<string>();
    const groupNameBySlug = new Map<string, string>();
    const mediaSlugSet = new Set<string>();

    // Pré-validação e coleta
    const prepared = parsed.map(({ line, raw }) => {
      const groupName = String(raw.GRUPO ?? '').trim();
      const typeStr = String(raw.TIPO ?? '').trim().toUpperCase();
      const content = String(raw.CONTEUDO ?? '').trim();
      const mediaSlug = String(raw.MEDIA_SLUG ?? '').trim();
      const weight = raw.PESO !== '' ? Number(raw.PESO) : 1;
      const statusStr = String(raw.STATUS ?? 'ACTIVE').trim().toUpperCase();

      if (!groupName) {
        errors.push({ line, message: 'GRUPO é obrigatório.', raw });
        return null;
      }

      const groupSlug = slugify(groupName);
      if (!groupSlug) {
        errors.push({ line, message: 'GRUPO inválido (slug vazio).', raw });
        return null;
      }
      groupSlugSet.add(groupSlug);
      groupNameBySlug.set(groupSlug, groupName);

      const type = (ContentGroupType as any)[typeStr] as ContentGroupType | undefined;
      if (!type || type === ContentGroupType.MIXED) {
        errors.push({ line, message: `TIPO inválido: ${typeStr}`, raw });
        return null;
      }

      const status =
        (ContentStatus as any)[statusStr] === ContentStatus.INACTIVE
          ? ContentStatus.INACTIVE
          : ContentStatus.ACTIVE;

      const parsedWeight = Number.isFinite(weight) ? Math.max(1, Math.min(100, Math.trunc(weight))) : 1;

      if (type === ContentGroupType.TEXT) {
        if (!content) {
          errors.push({ line, message: 'CONTEUDO é obrigatório para TIPO=TEXT.', raw });
          return null;
        }
      } else {
        if (!mediaSlug) {
          errors.push({ line, message: 'MEDIA_SLUG é obrigatório para TIPO de mídia.', raw });
          return null;
        }
        mediaSlugSet.add(mediaSlug);
      }

      return {
        line,
        groupSlug,
        groupName,
        type,
        textContent: type === ContentGroupType.TEXT ? content : null,
        mediaSlug: type === ContentGroupType.TEXT ? null : mediaSlug,
        weight: parsedWeight,
        status,
        raw,
      };
    });

    // Buscar/criar grupos
    const existingGroups = await this.prisma.contentGroup.findMany({
      where: { createdById: user.sub, slug: { in: [...groupSlugSet] } },
      select: { id: true, slug: true },
    });
    const groupBySlug = new Map(existingGroups.map((g) => [g.slug, g]));

    let createdGroups = 0;
    const missingSlugs = [...groupSlugSet].filter((s) => !groupBySlug.has(s));
    for (const slug of missingSlugs) {
      const name = groupNameBySlug.get(slug) ?? slug;
      const created = await this.prisma.contentGroup.create({
        data: {
          createdById: user.sub,
          name,
          slug,
          type: ContentGroupType.MIXED,
          selectionMode: ContentSelectionMode.RANDOM,
          status: ContentStatus.ACTIVE,
        },
        select: { id: true, slug: true },
      });
      groupBySlug.set(created.slug, created);
      createdGroups++;
    }

    // Buscar mídias por slug (para itens de mídia)
    const mediaBySlug = new Map<string, { id: string }>();
    if (mediaSlugSet.size) {
      const medias = await this.prisma.mediaLibrary.findMany({
        where: { userId: user.sub, slug: { in: [...mediaSlugSet] } },
        select: { id: true, slug: true },
      });
      for (const m of medias) mediaBySlug.set(m.slug, { id: m.id });
    }

    // Prefetch de itens existentes para dedupe
    const groupIds = [...groupBySlug.values()].map((g) => g.id);
    const existingItems = await this.prisma.contentGroupItem.findMany({
      where: { groupId: { in: groupIds } },
      select: { groupId: true, type: true, textContent: true, mediaId: true },
    });
    const keySet = new Set(
      existingItems.map((i) =>
        i.type === ContentGroupType.TEXT
          ? `${i.groupId}|${i.type}|${(i.textContent ?? '').trim()}`
          : `${i.groupId}|${i.type}|${i.mediaId ?? ''}`,
      ),
    );

    const toCreate: Prisma.ContentGroupItemCreateManyInput[] = [];
    let ignored = 0;

    for (const p of prepared) {
      if (!p) continue;
      const g = groupBySlug.get(p.groupSlug);
      if (!g) {
        errors.push({ line: p.line, message: 'Falha interna ao resolver grupo.', raw: p.raw });
        continue;
      }

      let mediaId: string | null = null;
      if (p.mediaSlug) {
        const media = mediaBySlug.get(p.mediaSlug);
        if (!media) {
          errors.push({
            line: p.line,
            message: `MEDIA_SLUG não encontrada: ${p.mediaSlug}`,
            raw: p.raw,
          });
          continue;
        }
        mediaId = media.id;
      }

      const key =
        p.type === ContentGroupType.TEXT
          ? `${g.id}|${p.type}|${(p.textContent ?? '').trim()}`
          : `${g.id}|${p.type}|${mediaId ?? ''}`;
      if (keySet.has(key)) {
        ignored++;
        continue;
      }
      keySet.add(key);

      toCreate.push({
        groupId: g.id,
        type: p.type,
        textContent: p.textContent,
        mediaId,
        weight: p.weight,
        status: p.status,
      });
    }

    let createdItems = 0;
    if (toCreate.length) {
      const res = await this.prisma.contentGroupItem.createMany({ data: toCreate });
      createdItems = res.count;
    }

    return {
      totalLines: rows.length,
      createdGroups,
      createdItems,
      ignoredItems: ignored,
      errors: errors.length,
      errorDetails: errors,
    };
  }
}
