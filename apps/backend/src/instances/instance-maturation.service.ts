import { InjectQueue } from '@nestjs/bullmq'
import { ForbiddenException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common'
import { ContactStatus, InstanceStatus, MessageType, UserRole } from '@prisma/client'
import { Queue } from 'bullmq'

import { JwtPayload } from '../auth/jwt.payload'
import { DynamicContentResolverService } from '../dynamic-content/dynamic-content-resolver.service'
import { EvolutionService } from '../evolution/evolution.service'
import { PrismaService } from '../prisma/prisma.service'
import { UpdateInstanceMaturationConfigDto } from './dto/update-instance-maturation-config.dto'

const MATURATION_QUEUE = 'instance-maturation-queue'
const DEFAULT_ENABLE_DELAY_MS = 10_000
const DEFAULT_SEND_DELAY_BETWEEN_MESSAGES_MS = 1_200

type MaturationJob = {
  instanceId: string
  targetInstanceId?: string | null
  triggerNow?: boolean
}

type MaturationTemplate = {
  id: string | null
  name: string
  content: string
  mediaId?: string | null
  ownerUserId: string | null
  isFallback?: boolean
}

type ResolvedGroupPayload = {
  sourceUserId: string
  slug: string
  type: MessageType
  text: string
  mediaId?: string
  fileName?: string
  mediaUrl?: string
}

type OutgoingMaturationMessage = {
  text: string
  messageType: MessageType
  templateId: string | null
  templateName: string
  contentGroupSlug: string | null
  media?: {
    mediaType: 'image' | 'video' | 'audio' | 'document'
    fileName: string
    mediaBase64OrUrl: string
  }
}

type InstanceForMaturation = {
  id: string
  userId: string
  instanceName: string
  phoneNumber: string | null
  status: InstanceStatus
  maturationEnabled: boolean
  maturationMessagesPerCycle: number
  maturationDailyLimit: number
  maturationIntervalMinSeconds: number
  maturationIntervalMaxSeconds: number
  maturationContentGroupSlugs: string[]
}

@Injectable()
export class InstanceMaturationService implements OnModuleInit {
  private readonly logger = new Logger(InstanceMaturationService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly evolution: EvolutionService,
    private readonly dynamicContentResolver: DynamicContentResolverService,
    @InjectQueue(MATURATION_QUEUE) private readonly maturationQueue: Queue<MaturationJob>,
  ) {}

  async onModuleInit() {
    const enabledInstances = await this.prisma.whatsAppInstance.findMany({
      where: { maturationEnabled: true },
      select: { id: true },
    })

    await Promise.all(enabledInstances.map((instance) => this.enqueue(instance.id)))
  }

  async updateEnabled(user: JwtPayload, instanceId: string, enabled: boolean) {
    const instance = await this.requireAccessibleInstance(user, instanceId)

    const updated = await this.prisma.whatsAppInstance.update({
      where: { id: instanceId },
      data: {
        maturationEnabled: enabled,
        maturationLastQueueAt: enabled ? new Date() : null,
        maturationNextSendAt: enabled ? new Date(Date.now() + DEFAULT_ENABLE_DELAY_MS) : null,
        maturationCurrentTargetId: enabled ? instance.maturationCurrentTargetId : null,
        maturationCurrentTargetName: enabled ? instance.maturationCurrentTargetName : null,
      },
    })

    if (enabled) {
      await this.enqueue(instanceId, DEFAULT_ENABLE_DELAY_MS)
    } else {
      await this.prisma.whatsAppInstance.update({
        where: { id: instanceId },
        data: {
          maturationCurrentTargetId: null,
          maturationCurrentTargetName: null,
          maturationNextSendAt: null,
        },
      })
    }

    return updated
  }

  async updateConfig(user: JwtPayload, instanceId: string, dto: UpdateInstanceMaturationConfigDto) {
    await this.requireAccessibleInstance(user, instanceId)

    return this.prisma.whatsAppInstance.update({
      where: { id: instanceId },
      data: {
        maturationMessagesPerCycle: dto.messagesPerCycle,
        maturationDailyLimit: dto.dailyLimit,
        maturationIntervalMinSeconds: dto.intervalMinSeconds,
        maturationIntervalMaxSeconds: dto.intervalMaxSeconds,
        maturationContentGroupSlugs: this.normalizeSlugs(dto.contentGroupSlugs),
      },
    })
  }

  async triggerNow(user: JwtPayload, instanceId: string) {
    const instance = await this.requireAccessibleInstance(user, instanceId)

    if (!instance.maturationEnabled) {
      throw new ForbiddenException('Ative a maturacao antes de disparar manualmente')
    }

    await this.enqueue(instanceId, 1_000, true)
    return { ok: true }
  }

  async enqueue(instanceId: string, delayMs?: number, triggerNow: boolean = false) {
    const instance = await this.prisma.whatsAppInstance.findUnique({
      where: { id: instanceId },
      select: {
        id: true,
        userId: true,
        instanceName: true,
        maturationEnabled: true,
        maturationIntervalMinSeconds: true,
        maturationIntervalMaxSeconds: true,
      },
    })

    if (!instance || !instance.maturationEnabled) return

    const target = await this.pickTarget(instance)
    const delay =
      typeof delayMs === 'number'
        ? delayMs
        : this.randomDelay(instance.maturationIntervalMinSeconds, instance.maturationIntervalMaxSeconds)
    const nextSendAt = new Date(Date.now() + delay)

    await this.prisma.whatsAppInstance
      .update({
        where: { id: instanceId },
        data: {
          maturationLastQueueAt: new Date(),
          maturationNextSendAt: nextSendAt,
          maturationCurrentTargetId: target?.id ?? null,
          maturationCurrentTargetName: target?.instanceName ?? null,
        },
      })
      .catch(() => undefined)

    await this.maturationQueue.add(
      'instance-maturation',
      { instanceId, targetInstanceId: target?.id ?? null, triggerNow },
      {
        delay,
        removeOnComplete: true,
        removeOnFail: 50,
      },
    )
  }

  async process(instanceId: string, jobTargetId?: string | null) {
    const origin = await this.prisma.whatsAppInstance.findUnique({
      where: { id: instanceId },
      select: {
        id: true,
        userId: true,
        instanceName: true,
        phoneNumber: true,
        status: true,
        maturationEnabled: true,
        maturationMessagesPerCycle: true,
        maturationDailyLimit: true,
        maturationIntervalMinSeconds: true,
        maturationIntervalMaxSeconds: true,
        maturationContentGroupSlugs: true,
      },
    })

    if (!origin || !origin.maturationEnabled) {
      return
    }

    const target = jobTargetId
      ? await this.prisma.whatsAppInstance.findFirst({
          where: {
            id: jobTargetId,
            userId: origin.userId,
            maturationEnabled: true,
            status: InstanceStatus.CONNECTED,
            phoneNumber: { not: null },
          },
          select: {
            id: true,
            instanceName: true,
            phoneNumber: true,
          },
        })
      : await this.pickTarget(origin)

    if (origin.status !== InstanceStatus.CONNECTED || !origin.phoneNumber || !target || !target.phoneNumber) {
      this.logger.debug(`[maturation] instance=${origin.instanceName} aguardando pares aptos`)
      await this.enqueue(origin.id)
      return
    }

    const sentToday = await this.countSentToday(origin.id)
    const remainingToday = Math.max(0, origin.maturationDailyLimit - sentToday)

    if (remainingToday <= 0) {
      await this.createLog({
        origin,
        target,
        text: '',
        templateId: null,
        templateName: 'Limite diario atingido',
        status: 'SKIPPED',
        errorMessage: `Limite diario de ${origin.maturationDailyLimit} mensagens atingido`,
        occurredAt: new Date(),
        messageType: MessageType.TEXT,
        contentGroupSlug: null,
      })
      await this.enqueue(origin.id)
      return
    }

    const batchSize = Math.min(Math.max(origin.maturationMessagesPerCycle, 1), remainingToday)

    for (let index = 0; index < batchSize; index += 1) {
      const occurredAt = new Date()
      const message = await this.buildOutgoingMessage(origin, target)

      if (!message.text.trim() && !message.media) {
        await this.createLog({
          origin,
          target,
          text: '',
          templateId: message.templateId,
          templateName: message.templateName,
          status: 'SKIPPED',
          errorMessage: 'Mensagem vazia apos processamento',
          occurredAt,
          messageType: message.messageType,
          contentGroupSlug: message.contentGroupSlug,
        })
        continue
      }

      try {
        if (message.media) {
          await this.evolution.sendMedia({
            instanceName: origin.instanceName,
            toNumber: target.phoneNumber,
            mediaType: message.media.mediaType,
            fileName: message.media.fileName,
            caption: message.text,
            mediaBase64OrUrl: message.media.mediaBase64OrUrl,
          })
        } else {
          await this.evolution.sendText(origin.instanceName, target.phoneNumber, message.text)
        }

        await this.createLog({
          origin,
          target,
          text: message.text,
          templateId: message.templateId,
          templateName: message.templateName,
          status: 'SENT',
          occurredAt,
          messageType: message.messageType,
          contentGroupSlug: message.contentGroupSlug,
        })
      } catch (error: any) {
        await this.createLog({
          origin,
          target,
          text: message.text,
          templateId: message.templateId,
          templateName: message.templateName,
          status: 'ERROR',
          errorMessage: error?.message ?? 'Falha ao enviar mensagem de maturacao',
          occurredAt,
          messageType: message.messageType,
          contentGroupSlug: message.contentGroupSlug,
        })
        throw error
      }

      if (batchSize > 1 && index < batchSize - 1) {
        await this.sleep(DEFAULT_SEND_DELAY_BETWEEN_MESSAGES_MS + Math.floor(Math.random() * 600))
      }
    }

    const completedAt = new Date()
    await this.prisma.whatsAppInstance.update({
      where: { id: origin.id },
      data: {
        maturationLastSentAt: completedAt,
        lastActivityAt: completedAt,
        maturationCurrentTargetId: target.id,
        maturationCurrentTargetName: target.instanceName,
        maturationNextSendAt: null,
      },
    })

    this.logger.log(
      `[maturation] ${origin.instanceName} -> ${target.instanceName} (${target.phoneNumber}) x${batchSize}`,
    )

    await this.enqueue(origin.id)
  }

  private async buildOutgoingMessage(
    origin: InstanceForMaturation,
    target: { id: string; instanceName: string; phoneNumber: string },
  ): Promise<OutgoingMaturationMessage> {
    const directDynamicPayload = await this.pickDirectDynamicPayload(
      origin.userId,
      origin.maturationContentGroupSlugs,
      origin.instanceName,
      target.instanceName,
    )

    const template = await this.pickTemplate(origin.userId)
    const renderedTemplate = await this.resolveTemplateForInstanceContext(
      template,
      origin,
      target,
    )

    if (directDynamicPayload) {
      if (directDynamicPayload.type === MessageType.TEXT) {
        return {
          text: directDynamicPayload.text,
          messageType: MessageType.TEXT,
          templateId: template.id,
          templateName: `${template.name} · grupo:${directDynamicPayload.slug}`,
          contentGroupSlug: directDynamicPayload.slug,
        }
      }

      return {
        text: renderedTemplate.text,
        messageType: directDynamicPayload.type,
        templateId: template.id,
        templateName: `${template.name} · grupo:${directDynamicPayload.slug}`,
        contentGroupSlug: directDynamicPayload.slug,
        media: {
          mediaType: this.mapMediaType(directDynamicPayload.type),
          fileName: directDynamicPayload.fileName ?? `${directDynamicPayload.slug}.${this.extensionForType(directDynamicPayload.type)}`,
          mediaBase64OrUrl: directDynamicPayload.mediaUrl ?? '',
        },
      }
    }

    if (renderedTemplate.primaryMedia) {
      return {
        text: renderedTemplate.text,
        messageType: renderedTemplate.primaryMedia.type,
        templateId: template.id,
        templateName: template.name,
        contentGroupSlug: renderedTemplate.primaryMedia.slug,
        media: {
          mediaType: this.mapMediaType(renderedTemplate.primaryMedia.type),
          fileName:
            renderedTemplate.primaryMedia.fileName ??
            `${renderedTemplate.primaryMedia.slug}.${this.extensionForType(renderedTemplate.primaryMedia.type)}`,
          mediaBase64OrUrl: renderedTemplate.primaryMedia.mediaUrl,
        },
      }
    }

    return {
      text: renderedTemplate.text,
      messageType: MessageType.TEXT,
      templateId: template.id,
      templateName: template.name,
      contentGroupSlug: null,
    }
  }

  private async resolveTemplateForInstanceContext(
    template: MaturationTemplate,
    origin: InstanceForMaturation,
    target: { instanceName: string; phoneNumber: string },
  ) {
    const renderedBase = this.renderTemplate(template.content, origin.instanceName, target.instanceName)

    if (!template.ownerUserId) {
      return { text: renderedBase, primaryMedia: null as null | { slug: string; type: MessageType; mediaUrl: string; fileName?: string } }
    }

    const fakeContact = {
      id: `maturation-${target.instanceName}`,
      userId: template.ownerUserId,
      name: target.instanceName,
      phone: target.phoneNumber,
      tag: 'maturation',
      optIn: true,
      status: ContactStatus.ACTIVE,
      source: 'maturation',
      optOutAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const resolved = await this.dynamicContentResolver.resolveTemplate(
      template.ownerUserId,
      renderedBase,
      fakeContact,
      { dryRun: false },
    )

    let text = resolved.renderedText
      .replace(/\[M[ií]dia: [^\]]+\]/gi, '')
      .trim()

    const directTemplateMedia =
      template.mediaId
        ? await this.prisma.mediaLibrary.findUnique({
            where: { id: template.mediaId },
            select: { id: true, name: true, publicUrl: true, filePath: true, type: true },
          })
        : null

    if (!text && !directTemplateMedia && resolved.dynamicMedia.length === 0) {
      text = this.buildFallbackTemplate().content
      text = this.renderTemplate(text, origin.instanceName, target.instanceName)
    }

    const firstMedia = resolved.dynamicMedia[0]
    if (!firstMedia && directTemplateMedia && (directTemplateMedia.publicUrl || directTemplateMedia.filePath)) {
      return {
        text,
        primaryMedia: {
          slug: 'template-media',
          type: this.normalizeMessageType(directTemplateMedia.type),
          mediaUrl: directTemplateMedia.publicUrl ?? directTemplateMedia.filePath ?? '',
          fileName: directTemplateMedia.name,
        },
      }
    }

    if (!firstMedia) {
      return { text, primaryMedia: null as null | { slug: string; type: MessageType; mediaUrl: string; fileName?: string } }
    }

    const media = await this.prisma.mediaLibrary.findUnique({
      where: { id: firstMedia.mediaId },
      select: { id: true, name: true, publicUrl: true, filePath: true, type: true },
    })

    if (!media || (!media.publicUrl && !media.filePath)) {
      return { text, primaryMedia: null as null | { slug: string; type: MessageType; mediaUrl: string; fileName?: string } }
    }

    return {
      text,
      primaryMedia: {
        slug: firstMedia.slug,
        type: this.normalizeMessageType(firstMedia.type),
        mediaUrl: media.publicUrl ?? media.filePath ?? '',
        fileName: media.name,
      },
    }
  }

  private async pickDirectDynamicPayload(
    originUserId: string,
    configuredSlugs: string[],
    originName: string,
    targetName: string,
  ): Promise<ResolvedGroupPayload | null> {
    const slugs = this.normalizeSlugs(configuredSlugs)
    if (slugs.length === 0) return null

    const shuffled = [...slugs].sort(() => Math.random() - 0.5)
    const adminIds = originUserId ? await this.getAdminUserIds() : []

    for (const slug of shuffled) {
      const candidateUserIds = [originUserId, ...adminIds.filter((id) => id !== originUserId)]

      for (const candidateUserId of candidateUserIds) {
        const resolved = await this.dynamicContentResolver.resolveGroup(candidateUserId, slug, false)
        if (!resolved) continue

        if (resolved.item.type === 'TEXT') {
          return {
            sourceUserId: candidateUserId,
            slug,
            type: MessageType.TEXT,
            text: this.renderTemplate(resolved.item.textContent ?? '', originName, targetName),
          }
        }

        const media = resolved.item.media
        if (!media || (!media.publicUrl && !media.filePath)) continue

        return {
          sourceUserId: candidateUserId,
          slug,
          type: this.normalizeMessageType(resolved.item.type),
          text: '',
          mediaId: media.id,
          fileName: media.name,
          mediaUrl: media.publicUrl ?? media.filePath ?? undefined,
        }
      }
    }

    return null
  }

  private async pickTarget(origin: { id: string; userId: string }) {
    const eligibleTargets = await this.prisma.whatsAppInstance.findMany({
      where: {
        userId: origin.userId,
        id: { not: origin.id },
        maturationEnabled: true,
        status: InstanceStatus.CONNECTED,
        phoneNumber: { not: null },
      },
      orderBy: [{ maturationLastSentAt: 'asc' }, { updatedAt: 'asc' }],
      select: {
        id: true,
        instanceName: true,
        phoneNumber: true,
      },
    })

    if (eligibleTargets.length === 0) return null

    return eligibleTargets[Math.floor(Math.random() * Math.min(eligibleTargets.length, 3))] ?? eligibleTargets[0]
  }

  private async pickTemplate(userId: string): Promise<MaturationTemplate> {
    const templates = await this.prisma.messageTemplate.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, content: true, mediaId: true, userId: true },
    })

    if (templates.length > 0) {
      const template = templates[Math.floor(Math.random() * templates.length)] ?? templates[0]
      return { ...template, ownerUserId: template.userId }
    }

    const adminTemplates = await this.prisma.messageTemplate.findMany({
      where: { user: { role: UserRole.ADMIN } },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      select: { id: true, name: true, content: true, mediaId: true, userId: true },
      take: 20,
    })

    if (adminTemplates.length > 0) {
      const template = adminTemplates[Math.floor(Math.random() * adminTemplates.length)] ?? adminTemplates[0]
      return {
        id: template.id,
        name: `${template.name} (admin)`,
        content: template.content,
        mediaId: template.mediaId,
        ownerUserId: template.userId,
      }
    }

    return this.buildFallbackTemplate()
  }

  private buildFallbackTemplate(): MaturationTemplate {
    return {
      id: null,
      name: 'Fallback automatico',
      content:
        'Ola! Aqui e {{instancia_origem}} falando com {{instancia_destino}} para aquecer a instancia.',
      mediaId: null,
      ownerUserId: null,
      isFallback: true,
    }
  }

  private async createLog(params: {
    origin: { id: string }
    target: { id: string; instanceName: string; phoneNumber: string | null }
    text: string
    templateId?: string | null
    templateName?: string | null
    status: string
    errorMessage?: string | null
    occurredAt: Date
    messageType: MessageType
    contentGroupSlug?: string | null
  }) {
    await this.prisma.instanceMaturationLog.create({
      data: {
        originInstanceId: params.origin.id,
        targetInstanceId: params.target.id,
        targetInstanceName: params.target.instanceName,
        targetPhoneNumber: params.target.phoneNumber,
        templateId: params.templateId ?? null,
        templateName: params.templateName ?? null,
        text: params.text,
        status: params.status,
        errorMessage: params.errorMessage ?? null,
        occurredAt: params.occurredAt,
        messageType: params.messageType,
        contentGroupSlug: params.contentGroupSlug ?? null,
      },
    })
  }

  private async requireAccessibleInstance(user: JwtPayload, instanceId: string) {
    const instance = await this.prisma.whatsAppInstance.findUnique({
      where: { id: instanceId },
    })

    if (!instance) {
      throw new NotFoundException('Instancia nao encontrada')
    }

    if (user.role !== UserRole.ADMIN && instance.userId !== user.sub) {
      throw new ForbiddenException('Acesso negado para esta instancia')
    }

    return instance
  }

  private normalizeSlugs(slugs: string[]) {
    return Array.from(
      new Set(
        slugs
          .map((slug) => slug.trim().toLowerCase())
          .filter(Boolean),
      ),
    )
  }

  private renderTemplate(content: string, originName: string, targetName: string) {
    const now = new Date()
    const getGreeting = () => {
      const hour = now.getHours()
      if (hour < 12) return 'Bom dia'
      if (hour < 18) return 'Boa tarde'
      return 'Boa noite'
    }

    return content
      .replaceAll('{{instancia_origem}}', originName)
      .replaceAll('{{instancia_destino}}', targetName)
      .replaceAll('{{saudacao}}', getGreeting())
      .replaceAll('{{data}}', now.toLocaleDateString('pt-BR'))
      .replaceAll('{{hora}}', now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
      .trim()
  }

  private randomDelay(minSeconds: number, maxSeconds: number) {
    const min = Math.max(15, minSeconds)
    const max = Math.max(min, maxSeconds)
    const randomSeconds = Math.floor(Math.random() * (max - min + 1)) + min
    return randomSeconds * 1000
  }

  private async countSentToday(instanceId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return this.prisma.instanceMaturationLog.count({
      where: {
        originInstanceId: instanceId,
        status: 'SENT',
        occurredAt: { gte: today },
      },
    })
  }

  private async getAdminUserIds() {
    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: { id: true },
      take: 10,
    })
    return admins.map((admin) => admin.id)
  }

  private normalizeMessageType(type: string) {
    switch (type) {
      case 'IMAGE':
        return MessageType.IMAGE
      case 'VIDEO':
        return MessageType.VIDEO
      case 'AUDIO':
        return MessageType.AUDIO
      case 'DOCUMENT':
        return MessageType.DOCUMENT
      default:
        return MessageType.TEXT
    }
  }

  private mapMediaType(type: MessageType): 'image' | 'video' | 'audio' | 'document' {
    switch (type) {
      case MessageType.IMAGE:
        return 'image'
      case MessageType.VIDEO:
        return 'video'
      case MessageType.AUDIO:
        return 'audio'
      default:
        return 'document'
    }
  }

  private extensionForType(type: MessageType) {
    switch (type) {
      case MessageType.IMAGE:
        return 'jpg'
      case MessageType.VIDEO:
        return 'mp4'
      case MessageType.AUDIO:
        return 'mp3'
      default:
        return 'bin'
    }
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
