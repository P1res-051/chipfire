import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import { StorageService } from './storage.service'
import { CreateTextMediaDto } from './dto/create-text-media.dto'
import { UpdateMediaDto } from './dto/update-media.dto'
import { MediaType } from '@prisma/client'
import { randomUrlToken } from '../common/random'

@Injectable()
export class MediaService {
  private readonly maxMediaSizeMb: number

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private config: ConfigService,
  ) {
    this.maxMediaSizeMb = this.config.get<number>('MAX_MEDIA_SIZE_MB', 25)
  }

  /**
   * Determinar tipo de mídia baseado na extensão/mimetype
   */
  private determineMediaType(mimetype: string): MediaType {
    if (mimetype.startsWith('image/')) return 'IMAGE'
    if (mimetype.startsWith('video/')) return 'VIDEO'
    if (mimetype.startsWith('audio/')) return 'AUDIO'
    if (mimetype === 'application/pdf') return 'PDF'
    if (
      mimetype === 'application/msword' ||
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimetype === 'application/vnd.ms-excel' ||
      mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      return 'DOCUMENT'
    }
    return 'DOCUMENT' // fallback
  }

  /**
   * Gerar slug único
   */
  private async generateUniqueSlug(baseName: string): Promise<string> {
    const baseSlug = baseName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50)

    let slug = baseSlug || randomUrlToken(8)
    let counter = 1

    while (
      await this.prisma.mediaLibrary.findFirst({
        where: { slug },
      })
    ) {
      slug = `${baseSlug || 'media'}-${counter}`
      counter++
    }

    return slug
  }

  /**
   * Listar mídias do usuário com filtros
   */
  async listMedia(
    userId: string,
    filters: {
      type?: MediaType
      search?: string
      tag?: string
      limit?: number
      offset?: number
    },
  ) {
    const limit = Math.min(filters.limit || 50, 100)
    const offset = filters.offset || 0

    const where: any = { userId }

    if (filters.type) {
      where.type = filters.type
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { slug: { contains: filters.search, mode: 'insensitive' } },
        { tags: { hasSome: [filters.search] } },
      ]
    }

    if (filters.tag) {
      where.tags = { hasSome: [filters.tag] }
    }

    const [items, total] = await Promise.all([
      this.prisma.mediaLibrary.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.mediaLibrary.count({ where }),
    ])

    return {
      items: items.map((m) => ({
        ...m,
        variable: this.getVariableForMedia(m.type, m.slug),
      })),
      total,
      limit,
      offset,
    }
  }

  /**
   * Upload de arquivo
   */
  async uploadMedia(
    userId: string,
    file: Express.Multer.File,
    tags?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo não fornecido')
    }

    // Validar tamanho
    const fileSizeMb = file.size / (1024 * 1024)
    if (fileSizeMb > this.maxMediaSizeMb) {
      throw new BadRequestException(
        `Arquivo excede tamanho máximo de ${this.maxMediaSizeMb}MB`,
      )
    }

    // Determinar tipo
    const type = this.determineMediaType(file.mimetype)

    // Gerar slug
    const slug = await this.generateUniqueSlug(
      file.originalname.replace(/\.[^/.]+$/, ''),
    )

    // Fazer upload
    const { publicUrl, filePath } = await this.storage.uploadFile(file, slug)

    // Parsear tags
    const tagsList = tags
      ? tags.split(',').map((t) => t.trim()).filter(Boolean)
      : []

    // Salvar no banco
    const media = await this.prisma.mediaLibrary.create({
      data: {
        userId,
        name: file.originalname.replace(/\.[^/.]+$/, ''),
        slug,
        type,
        filePath,
        publicUrl,
        mimeType: file.mimetype,
        size: file.size,
        tags: tagsList,
      },
    })

    return {
      ...media,
      variable: this.getVariableForMedia(media.type, media.slug),
    }
  }

  /**
   * Criar texto pronto
   */
  async createTextMedia(
    userId: string,
    dto: CreateTextMediaDto,
  ) {
    const slug = await this.generateUniqueSlug(dto.name)
    const tagsList = dto.tags
      ? dto.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : []

    const media = await this.prisma.mediaLibrary.create({
      data: {
        userId,
        name: dto.name,
        slug,
        type: 'TEXT',
        publicUrl: null, // Texto não tem URL
        filePath: null,
        mimeType: 'text/plain',
        size: Buffer.byteLength(dto.content, 'utf8'),
        tags: tagsList,
      },
    })

    return {
      ...media,
      content: dto.content,
      variable: this.getVariableForMedia(media.type, media.slug),
    }
  }

  /**
   * Obter detalhe de mídia
   */
  async getMediaById(id: string, userId: string) {
    const media = await this.prisma.mediaLibrary.findUnique({
      where: { id },
    })

    if (!media) {
      throw new NotFoundException('Mídia não encontrada')
    }

    if (media.userId !== userId) {
      throw new ForbiddenException('Acesso negado')
    }

    return {
      ...media,
      variable: this.getVariableForMedia(media.type, media.slug),
    }
  }

  /**
   * Editar mídia
   */
  async updateMedia(
    id: string,
    userId: string,
    dto: UpdateMediaDto,
  ) {
    const media = await this.prisma.mediaLibrary.findUnique({
      where: { id },
    })

    if (!media) {
      throw new NotFoundException('Mídia não encontrada')
    }

    if (media.userId !== userId) {
      throw new ForbiddenException('Acesso negado')
    }

    const tagsList = dto.tags
      ? dto.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : media.tags

    const updated = await this.prisma.mediaLibrary.update({
      where: { id },
      data: {
        name: dto.name || media.name,
        tags: tagsList,
      },
    })

    return {
      ...updated,
      variable: this.getVariableForMedia(updated.type, updated.slug),
    }
  }

  /**
   * Deletar mídia
   */
  async deleteMedia(id: string, userId: string) {
    const media = await this.prisma.mediaLibrary.findUnique({
      where: { id },
    })

    if (!media) {
      throw new NotFoundException('Mídia não encontrada')
    }

    if (media.userId !== userId) {
      throw new ForbiddenException('Acesso negado')
    }

    // Deletar arquivo do storage se existir
    if (media.filePath) {
      await this.storage.deleteFile(media.filePath)
    }

    // Deletar do banco
    await this.prisma.mediaLibrary.delete({
      where: { id },
    })

    return { success: true }
  }

  /**
   * Obter stream para preview
   */
  async getMediaPreview(id: string, userId: string) {
    const media = await this.getMediaById(id, userId)

    if (!media.filePath) {
      throw new BadRequestException('Mídia não tem arquivo para preview')
    }

    const stream = await this.storage.getFileStream(media.filePath)
    if (!stream) {
      throw new NotFoundException('Arquivo não encontrado no storage')
    }

    return { stream, mimeType: media.mimeType }
  }

  /**
   * Gerar string de variável para cada tipo
   */
  private getVariableForMedia(type: MediaType, slug: string): string {
    const typeMap: Record<MediaType, string> = {
      IMAGE: `{{imagem:${slug}}}`,
      VIDEO: `{{video:${slug}}}`,
      AUDIO: `{{audio:${slug}}}`,
      PDF: `{{documento:${slug}}}`,
      DOCUMENT: `{{documento:${slug}}}`,
      TEXT: `{{texto:${slug}}}`,
    }
    return typeMap[type] || `{{midia:${slug}}}`
  }
}
