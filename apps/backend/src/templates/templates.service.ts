import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { JwtPayload } from '../auth/jwt.payload';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: JwtPayload) {
    return this.prisma.messageTemplate.findMany({
      where: user.role === UserRole.ADMIN ? undefined : { userId: user.sub },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(user: JwtPayload, id: string) {
    const tpl = await this.prisma.messageTemplate.findUnique({ where: { id } });
    if (!tpl) throw new NotFoundException('Template não encontrado');
    if (user.role !== UserRole.ADMIN && tpl.userId !== user.sub) {
      throw new ForbiddenException('Acesso negado');
    }
    return tpl;
  }

  async create(user: JwtPayload, data: { name: string; content: string; tags: string[] }) {
    // Admin cria templates globais? Neste MVP: todo template pertence a um userId.
    return this.prisma.messageTemplate.create({
      data: { userId: user.sub, name: data.name, content: data.content, tags: data.tags ?? [] },
    });
  }

  async update(user: JwtPayload, id: string, data: Partial<{ name: string; content: string; tags: string[] }>) {
    await this.get(user, id);
    return this.prisma.messageTemplate.update({ where: { id }, data });
  }

  async remove(user: JwtPayload, id: string) {
    await this.get(user, id);
    await this.prisma.messageTemplate.delete({ where: { id } });
    return { ok: true };
  }
}

