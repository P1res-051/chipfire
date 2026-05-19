import { InjectQueue } from '@nestjs/bullmq'
import { ForbiddenException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common'
import { Queue } from 'bullmq'
import { InstanceStatus, UserRole } from '@prisma/client'

import { JwtPayload } from '../auth/jwt.payload'
import { EvolutionService } from '../evolution/evolution.service'
import { PrismaService } from '../prisma/prisma.service'

const MATURATION_QUEUE = 'instance-maturation-queue'
const MIN_DELAY_MS = 3 * 60 * 1000
const MAX_DELAY_MS = 7 * 60 * 1000

type MaturationJob = {
  instanceId: string
  targetInstanceId?: string | null
  triggerNow?: boolean
}

type MaturationTemplate = {
  id: string | null
  name: string
  content: string
  isFallback?: boolean
}

@Injectable()
export class InstanceMaturationService implements OnModuleInit {
  private readonly logger = new Logger(InstanceMaturationService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly evolution: EvolutionService,
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
    const instance = await this.prisma.whatsAppInstance.findUnique({
      where: { id: instanceId },
    })

    if (!instance) {
      throw new NotFoundException('Instancia nao encontrada')
    }

    if (user.role !== UserRole.ADMIN && instance.userId !== user.sub) {
      throw new ForbiddenException('Acesso negado para esta instancia')
    }

    const updated = await this.prisma.whatsAppInstance.update({
      where: { id: instanceId },
      data: {
        maturationEnabled: enabled,
        maturationLastQueueAt: enabled ? new Date() : null,
        maturationNextSendAt: enabled ? new Date(Date.now() + 10_000) : null,
        maturationCurrentTargetId: enabled ? instance.maturationCurrentTargetId : null,
        maturationCurrentTargetName: enabled ? instance.maturationCurrentTargetName : null,
      },
    })

    if (enabled) {
      await this.enqueue(instanceId, 10_000)
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

  async triggerNow(user: JwtPayload, instanceId: string) {
    const instance = await this.prisma.whatsAppInstance.findUnique({
      where: { id: instanceId },
    })

    if (!instance) {
      throw new NotFoundException('Instancia nao encontrada')
    }

    if (user.role !== UserRole.ADMIN && instance.userId !== user.sub) {
      throw new ForbiddenException('Acesso negado para esta instancia')
    }

    if (!instance.maturationEnabled) {
      throw new ForbiddenException('Ative a maturacao antes de disparar manualmente')
    }

    await this.enqueue(instanceId, 1000, true)
    return { ok: true }
  }

  async enqueue(instanceId: string, delayMs?: number, triggerNow: boolean = false) {
    const instance = await this.prisma.whatsAppInstance.findUnique({
      where: { id: instanceId },
    })

    if (!instance || !instance.maturationEnabled) return

    const target = await this.pickTarget(instance)
    const delay = typeof delayMs === 'number' ? delayMs : this.randomDelay()
    const nextSendAt = new Date(Date.now() + delay)

    await this.prisma.whatsAppInstance.update({
      where: { id: instanceId },
      data: {
        maturationLastQueueAt: new Date(),
        maturationNextSendAt: nextSendAt,
        maturationCurrentTargetId: target?.id ?? null,
        maturationCurrentTargetName: target?.instanceName ?? null,
      },
    }).catch(() => undefined)

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
        })
      : await this.pickTarget(origin)

    if (
      origin.status !== InstanceStatus.CONNECTED ||
      !origin.phoneNumber ||
      !target ||
      !target.phoneNumber
    ) {
      this.logger.debug(
        `[maturation] instance=${origin.instanceName} aguardando pares aptos`,
      )
      await this.enqueue(origin.id)
      return
    }

    const template = await this.pickTemplate(origin.userId)
    const text = this.renderTemplate(template.content, origin.instanceName, target.instanceName)
    const occurredAt = new Date()

    if (!text.trim()) {
      await this.createLog({
        origin,
        target,
        text: '',
        templateId: template.id,
        templateName: template.name,
        status: 'SKIPPED',
        errorMessage: 'Template vazio apos processamento',
        occurredAt,
      })
      await this.enqueue(origin.id)
      return
    }

    try {
      await this.evolution.sendText(origin.instanceName, target.phoneNumber, text)
      await this.createLog({
        origin,
        target,
        text,
        templateId: template.id,
        templateName: template.name,
        status: 'SENT',
        occurredAt,
      })
    } catch (error: any) {
      await this.createLog({
        origin,
        target,
        text,
        templateId: template.id,
        templateName: template.name,
        status: 'ERROR',
        errorMessage: error?.message ?? 'Falha ao enviar mensagem de maturacao',
        occurredAt,
      })
      throw error
    }

    await this.prisma.whatsAppInstance.update({
      where: { id: origin.id },
      data: {
        maturationLastSentAt: occurredAt,
        lastActivityAt: occurredAt,
        maturationCurrentTargetId: target.id,
        maturationCurrentTargetName: target.instanceName,
        maturationNextSendAt: null,
      },
    })

    this.logger.log(
      `[maturation] ${origin.instanceName} -> ${target.instanceName} (${target.phoneNumber})`,
    )

    await this.enqueue(origin.id)
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
    })

    if (eligibleTargets.length === 0) return null

    return (
      eligibleTargets[Math.floor(Math.random() * Math.min(eligibleTargets.length, 3))] ??
      eligibleTargets[0]
    )
  }

  private async pickTemplate(userId: string) {
    const templates = await this.prisma.messageTemplate.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, content: true },
    })

    if (templates.length === 0) return this.buildFallbackTemplate()

    return templates[Math.floor(Math.random() * templates.length)] ?? templates[0]
  }

  private buildFallbackTemplate(): MaturationTemplate {
    return {
      id: null,
      name: 'Fallback automatico',
      content:
        'Ola! Aqui e {{instancia_origem}} falando com {{instancia_destino}} para aquecer a instancia.',
      isFallback: true,
    }
  }

  private renderTemplate(content: string, originName: string, targetName: string) {
    return content
      .replaceAll('{{instancia_origem}}', originName)
      .replaceAll('{{instancia_destino}}', targetName)
      .trim()
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
      },
    })
  }

  private randomDelay() {
    return Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS
  }
}
