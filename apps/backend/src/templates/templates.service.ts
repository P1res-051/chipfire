import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { UserRole } from '@prisma/client'

import { JwtPayload } from '../auth/jwt.payload'
import { PrismaService } from '../prisma/prisma.service'

const templateMediaSelect = {
  id: true,
  name: true,
  slug: true,
  type: true,
  publicUrl: true,
  mimeType: true,
} as const

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: JwtPayload) {
    return this.prisma.messageTemplate.findMany({
      where: user.role === UserRole.ADMIN ? undefined : { userId: user.sub },
      include: { media: { select: templateMediaSelect } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async get(user: JwtPayload, id: string) {
    const template = await this.prisma.messageTemplate.findUnique({
      where: { id },
      include: { media: { select: templateMediaSelect } },
    })

    if (!template) throw new NotFoundException('Template nao encontrado')
    if (user.role !== UserRole.ADMIN && template.userId !== user.sub) {
      throw new ForbiddenException('Acesso negado')
    }

    return template
  }

  async create(
    user: JwtPayload,
    data: { name: string; content: string; mediaId?: string | null; tags: string[] },
  ) {
    if (data.mediaId) {
      await this.assertMediaOwnership(user, data.mediaId)
    }

    return this.prisma.messageTemplate.create({
      data: {
        userId: user.sub,
        name: data.name,
        content: data.content ?? '',
        mediaId: data.mediaId ?? null,
        tags: data.tags ?? [],
      },
      include: { media: { select: templateMediaSelect } },
    })
  }

  async update(
    user: JwtPayload,
    id: string,
    data: Partial<{ name: string; content: string; mediaId: string | null; tags: string[] }>,
  ) {
    const current = await this.get(user, id)

    if (data.mediaId) {
      await this.assertMediaOwnership(user, data.mediaId)
    }

    const nextContent = data.content ?? current.content ?? ''
    const nextMediaId = data.mediaId === undefined ? current.mediaId ?? null : data.mediaId

    if (!nextContent.trim() && !nextMediaId) {
      throw new BadRequestException('Informe texto ou selecione uma midia principal')
    }

    return this.prisma.messageTemplate.update({
      where: { id },
      data: {
        name: data.name,
        content: nextContent,
        mediaId: nextMediaId,
        tags: data.tags,
      },
      include: { media: { select: templateMediaSelect } },
    })
  }

  async remove(user: JwtPayload, id: string) {
    await this.get(user, id)
    await this.prisma.messageTemplate.delete({ where: { id } })
    return { ok: true }
  }

  private async assertMediaOwnership(user: JwtPayload, mediaId: string) {
    const media = await this.prisma.mediaLibrary.findUnique({ where: { id: mediaId } })
    if (!media) {
      throw new NotFoundException('Midia nao encontrada')
    }

    if (user.role !== UserRole.ADMIN && media.userId !== user.sub) {
      throw new ForbiddenException('Acesso negado a midia selecionada')
    }
  }
}
