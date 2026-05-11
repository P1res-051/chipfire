import { Injectable, BadRequestException, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ContentSelectionMode, Contact } from '@prisma/client'

export interface DynamicGroup {
  slug: string
  groupId: string
  itemId: string
  type: string
  selectionMode: ContentSelectionMode
  value?: string
  mediaId?: string
  filePath?: string
  publicUrl?: string
}

export interface ResolveResult {
  renderedText: string
  dynamicGroups: DynamicGroup[]
  dynamicMedia: Array<{ slug: string; type: string; mediaId: string; filePath?: string; publicUrl?: string }>
  warnings: string[]
  errors: string[]
  hasDynamicContent: boolean
}

@Injectable()
export class DynamicContentResolverService {
  private readonly logger = new Logger(DynamicContentResolverService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Extrai slugs de variáveis dinâmicas do formato {{grupo:slug}}
   * Aceita: minúsculas, números, hífen, underscore
   */
  extractGroupSlugs(content: string): string[] {
    const regex = /\{\{grupo:([a-z0-9-_]+)\}\}/gi
    const slugs = new Set<string>()
    let m: RegExpExecArray | null

    while ((m = regex.exec(content))) {
      slugs.add(String(m[1]).toLowerCase())
    }

    return [...slugs]
  }

  /**
   * Valida se todos os grupos existem, estão ativos e têm items válidos
   */
  async validateGroups(
    userId: string,
    slugs: string[],
  ): Promise<{ valid: boolean; problems: string[] }> {
    if (!slugs.length) {
      return { valid: true, problems: [] }
    }

    const problems: string[] = []
    const unique = Array.from(new Set(slugs.map((s) => s.toLowerCase())))

    for (const slug of unique) {
      const group = await this.prisma.contentGroup.findFirst({
        where: { createdById: userId, slug },
        include: {
          items: {
            where: { status: 'ACTIVE' },
            include: { media: true },
          },
        },
      })

      if (!group) {
        problems.push(`Grupo {{grupo:${slug}}} não foi encontrado.`)
        continue
      }

      if (group.status !== 'ACTIVE') {
        problems.push(`Grupo {{grupo:${slug}}} está inativo.`)
        continue
      }

      const activeItems = group.items ?? []
      if (!activeItems.length) {
        problems.push(`Grupo {{grupo:${slug}}} não possui itens ativos.`)
        continue
      }

      // Validar items: TEXT deve ter conteúdo, mídia deve ter arquivo válido
      const validTextItems = activeItems.filter(
        (i) => i.type === 'TEXT' && Boolean(i.textContent?.trim()),
      )

      const validMediaItems = activeItems.filter((i) => {
        if (i.type === 'TEXT') return false
        if (!i.mediaId) return false
        if (!i.media) return false
        return true
      })

      const hasInvalidMedia = activeItems.some(
        (i) => i.type !== 'TEXT' && (!i.mediaId || !i.media),
      )

      const hasAnyValid = validTextItems.length > 0 || validMediaItems.length > 0
      if (!hasAnyValid) {
        if (hasInvalidMedia) {
          problems.push(`Grupo {{grupo:${slug}}} possui mídia inválida ou removida.`)
        } else {
          problems.push(`Grupo {{grupo:${slug}}} não possui itens ativos válidos.`)
        }
      }
    }

    return {
      valid: problems.length === 0,
      problems,
    }
  }

  /**
   * Resolve um grupo específico selecionando um item conforme o modo de seleção
   * @param userId - ID do usuário que criou o grupo
   * @param slug - Slug do grupo
   * @param dryRun - Se true, não incrementa usageCount/lastUsedAt
   */
  async resolveGroup(
    userId: string,
    slug: string,
    dryRun = false,
  ): Promise<{ item: any; group: any } | null> {
    const group = await this.prisma.contentGroup.findFirst({
      where: { createdById: userId, slug },
      include: {
        items: {
          where: { status: 'ACTIVE' },
          include: { media: true },
        },
      },
    })

    if (!group || group.status !== 'ACTIVE' || !group.items?.length) {
      return null
    }

    const activeItems = group.items

    let picked: any = null

    switch (group.selectionMode) {
      case 'RANDOM':
        picked = activeItems[Math.floor(Math.random() * activeItems.length)]
        break

      case 'SEQUENTIAL':
        // Ordenar por lastUsedAt (nunca usados vêm primeiro)
        const sorted = activeItems.sort((a, b) => {
          const aTime = a.lastUsedAt?.getTime() ?? 0
          const bTime = b.lastUsedAt?.getTime() ?? 0
          return aTime - bTime
        })
        picked = sorted[0]
        break

      case 'WEIGHTED_RANDOM': {
        const weights = activeItems.map((i) => i.weight ?? 1)
        const totalWeight = weights.reduce((a, b) => a + b, 0)
        let random = Math.random() * totalWeight
        for (let i = 0; i < activeItems.length; i++) {
          random -= weights[i]
          if (random <= 0) {
            picked = activeItems[i]
            break
          }
        }
        if (!picked) picked = activeItems[0]
        break
      }

      case 'LEAST_USED':
        picked = activeItems.reduce((least, current) => {
          const leastCount = least.usageCount ?? 0
          const currentCount = current.usageCount ?? 0
          return currentCount < leastCount ? current : least
        })
        break

      default:
        picked = activeItems[0]
    }

    if (!picked) {
      return null
    }

    // Se não for dryRun, incrementar estatísticas
    if (!dryRun) {
      await this.prisma.contentGroupItem.update({
        where: { id: picked.id },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date(),
        },
      })
    }

    return { item: picked, group }
  }

  /**
   * Resolve variáveis normais ({{nome}}, {{data}}, etc) e dinâmicas ({{grupo:slug}})
   */
  async resolveTemplate(
    userId: string,
    content: string,
    contact: Contact,
    options?: { dryRun?: boolean },
  ): Promise<ResolveResult> {
    const dryRun = options?.dryRun ?? false
    const warnings: string[] = []
    const errors: string[] = []
    const dynamicGroups: DynamicGroup[] = []
    const dynamicMedia: ResolveResult['dynamicMedia'] = []

    // Resolver variáveis normais
    const now = new Date()
    const getSaudacao = () => {
      const h = now.getHours()
      if (h < 12) return 'Bom dia'
      if (h < 18) return 'Boa tarde'
      return 'Boa noite'
    }

    const formatDate = () => now.toLocaleDateString('pt-BR')
    const formatTime = () => now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    let renderedText = content
      .replace(/\{\{nome\}\}/gi, contact.name)
      .replace(/\{\{telefone\}\}/gi, contact.phone)
      .replace(/\{\{data\}\}/gi, formatDate())
      .replace(/\{\{hora\}\}/gi, formatTime())
      .replace(/\{\{saudacao\}\}/gi, getSaudacao())

    // Resolver variáveis dinâmicas
    const slugs = this.extractGroupSlugs(content)

    if (slugs.length > 0) {
      const resolvedBySlug = new Map<string, string>()

      for (const slug of slugs) {
        try {
          const result = await this.resolveGroup(userId, slug, dryRun)

          if (!result) {
            warnings.push(`Grupo {{grupo:${slug}}} não encontrado ou inválido`)
            resolvedBySlug.set(slug, `{{grupo:${slug}}}`)
            continue
          }

          const { item, group } = result

          let resolvedValue = ''
          let isMedia = false
          let mediaData = null

          if (item.type === 'TEXT') {
            resolvedValue = item.textContent || ''
            resolvedBySlug.set(slug, resolvedValue)
          } else {
            // Mídia
            isMedia = true
            if (!item.media) {
              errors.push(`Mídia inválida para grupo {{grupo:${slug}}}`)
              resolvedBySlug.set(slug, `[Mídia inválida: ${slug}]`)
              continue
            }

            mediaData = item.media
            resolvedValue = `[Mídia: ${item.media.name}]`
            resolvedBySlug.set(slug, resolvedValue)

            dynamicMedia.push({
              slug,
              type: item.type,
              mediaId: item.media.id,
              filePath: item.media.filePath,
              publicUrl: item.media.publicUrl,
            })
          }

          dynamicGroups.push({
            slug,
            groupId: group.id,
            itemId: item.id,
            type: item.type,
            selectionMode: group.selectionMode,
            value: item.type === 'TEXT' ? resolvedValue : undefined,
            mediaId: mediaData?.id,
            filePath: mediaData?.filePath,
            publicUrl: mediaData?.publicUrl,
          })
        } catch (err) {
          errors.push(`Erro ao resolver grupo {{grupo:${slug}}}: ${err instanceof Error ? err.message : 'desconhecido'}`)
          resolvedBySlug.set(slug, `{{grupo:${slug}}}`)
        }
      }

      // Substituir {{grupo:slug}} pelo valor resolvido
      renderedText = renderedText.replace(/\{\{grupo:([a-z0-9-_]+)\}\}/gi, (_full, slugRaw) => {
        const s = String(slugRaw).toLowerCase()
        return resolvedBySlug.get(s) ?? `{{grupo:${s}}}`
      })
    }

    return {
      renderedText,
      dynamicGroups,
      dynamicMedia,
      warnings,
      errors,
      hasDynamicContent: slugs.length > 0,
    }
  }
}
