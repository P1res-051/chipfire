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
}

const MATURATION_MESSAGES = [
  'Oi! Passando para manter a conversa ativa por aqui.',
  'Tudo certo? So dando um oi rapido para manter o numero aquecido.',
  'Mensagem curta de rotina para manter a atividade do WhatsApp.',
  'Ola! Seguimos com a maturacao automatica desta instancia.',
  'Passando para registrar atividade e manter o fluxo natural de mensagens.',
]

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
      },
    })

    if (enabled) {
      await this.enqueue(instanceId, 10_000)
    }

    return updated
  }

  async enqueue(instanceId: string, delayMs?: number) {
    const delay = typeof delayMs === 'number' ? delayMs : this.randomDelay()

    await this.prisma.whatsAppInstance.update({
      where: { id: instanceId },
      data: { maturationLastQueueAt: new Date() },
    }).catch(() => undefined)

    await this.maturationQueue.add(
      'instance-maturation',
      { instanceId },
      {
        delay,
        removeOnComplete: true,
        removeOnFail: 50,
      },
    )
  }

  async process(instanceId: string) {
    const origin = await this.prisma.whatsAppInstance.findUnique({
      where: { id: instanceId },
    })

    if (!origin || !origin.maturationEnabled) {
      return
    }

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

    if (
      origin.status !== InstanceStatus.CONNECTED ||
      !origin.phoneNumber ||
      eligibleTargets.length === 0
    ) {
      this.logger.debug(
        `[maturation] instance=${origin.instanceName} aguardando pares aptos`,
      )
      await this.enqueue(origin.id)
      return
    }

    const target =
      eligibleTargets[Math.floor(Math.random() * Math.min(eligibleTargets.length, 3))] ??
      eligibleTargets[0]

    const text = this.buildMessage(origin.instanceName, target.instanceName)

    await this.evolution.sendText(origin.instanceName, target.phoneNumber, text)

    const occurredAt = new Date()

    await this.prisma.whatsAppInstance.update({
      where: { id: origin.id },
      data: {
        maturationLastSentAt: occurredAt,
        lastActivityAt: occurredAt,
      },
    })

    this.logger.log(
      `[maturation] ${origin.instanceName} -> ${target.instanceName} (${target.phoneNumber})`,
    )

    await this.enqueue(origin.id)
  }

  private buildMessage(originName: string, targetName: string) {
    const base =
      MATURATION_MESSAGES[Math.floor(Math.random() * MATURATION_MESSAGES.length)] ??
      MATURATION_MESSAGES[0]
    return `${base} [${originName} -> ${targetName}]`
  }

  private randomDelay() {
    return Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS
  }
}
