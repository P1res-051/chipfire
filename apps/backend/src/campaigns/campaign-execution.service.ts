import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { PrismaService } from '../prisma/prisma.service'
import { EvolutionService } from '../evolution/evolution.service'
import { DynamicContentResolverService } from '../dynamic-content/dynamic-content-resolver.service'
import { ContactStatus } from '@prisma/client'

interface CampaignMessageJob {
  campaignId: string
  contactId: string
  instanceId: string
  phoneNumber: string
  templateId: string
  mediaId?: string
  attemptNumber: number
}

@Injectable()
export class CampaignExecutionService {
  private readonly logger = new Logger(CampaignExecutionService.name)

  constructor(
    private prisma: PrismaService,
    private evolution: EvolutionService,
    private dynamicContentResolver: DynamicContentResolverService,
    @InjectQueue('campaign-execution-queue') private campaignQueue: Queue,
  ) {}

  async enqueueCampaignMessages(campaignId: string): Promise<void> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        template: true,
        contacts: { include: { contact: true } },
        instances: { include: { instance: true } },
      },
    })

    if (!campaign) {
      throw new BadRequestException('Campanha nao encontrada')
    }

    if (campaign.status !== 'ACTIVE') {
      throw new BadRequestException('Campanha deve estar em ACTIVE')
    }

    const contactsByInstance: Map<string, string[]> = new Map()
    for (const inst of campaign.instances) {
      contactsByInstance.set(inst.instanceId, [])
    }

    const contactIds = campaign.contacts.map((c: any) => c.contact.id)
    let index = 0
    for (let i = 0; i < contactIds.length; i++) {
      if (campaign.instances.length === 0) break
      const instanceId = campaign.instances[index % campaign.instances.length].instanceId
      const list = contactsByInstance.get(instanceId)
      if (list) list.push(contactIds[i])
      index++
    }

    const jobs: any[] = []
    for (const [instanceId, contacts] of contactsByInstance) {
      const inst = campaign.instances.find(x => x.instanceId === instanceId)?.instance
      if (!inst) continue

      for (let i = 0; i < contacts.length; i++) {
        const contactId = contacts[i]
        const contact = campaign.contacts.find((c: any) => c.contact.id === contactId)?.contact
        if (!contact) continue

        const delay = Math.random() * (campaign.intervalMaxSeconds - campaign.intervalMinSeconds) + campaign.intervalMinSeconds
        jobs.push({
          campaignId,
          contactId,
          instanceId,
          phone: contact.phone,
          templateId: campaign.templateId,
          mediaId: campaign.mediaId,
          delay: Math.floor((i * delay * 1000) + Math.random() * 5000),
        })
      }
    }

    for (const job of jobs) {
      const delay = this.calculateDelay(campaign.allowedStartTime, campaign.allowedEndTime, job.delay)
      await this.campaignQueue.add(
        `campaign-${campaignId}`,
        { campaignId: job.campaignId, contactId: job.contactId, instanceId: job.instanceId, phone: job.phone, templateId: job.templateId, mediaId: job.mediaId, attempt: 0 },
        { delay, jobId: `campaign-${campaignId}-contact-${job.contactId}`, removeOnComplete: true, removeOnFail: false },
      )
    }

    this.logger.log(`[${campaignId}] Enfileirados ${jobs.length} mensagens`)
  }

  async processCampaignMessage(job: any): Promise<void> {
    const { campaignId, contactId, instanceId, phone, templateId, mediaId } = job
    let renderedMeta: any = {
      templateOriginal: '',
      renderedText: '',
      dynamicGroups: [],
      dynamicMedia: [],
      warnings: [],
      errors: [],
    }

    try {
      // Passo 1: Buscar campanha
      const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } })
      if (!campaign) {
        throw { code: 'CAMPAIGN_NOT_FOUND', message: 'Campanha nao encontrada' }
      }

      // Passo 2: Validar campanha ativa
      if (campaign.status !== 'ACTIVE') {
        this.logger.warn(`[${campaignId}] Campanha nao ativa, pulando`)
        return
      }

      // Passo 3: Buscar template
      const template = await this.prisma.messageTemplate.findUnique({ where: { id: templateId } })
      if (!template) {
        throw { code: 'TEMPLATE_NOT_FOUND', message: 'Template nao encontrado' }
      }

      // Passo 4: Buscar contato
      const contact = await this.prisma.contact.findUnique({ where: { id: contactId } })
      if (!contact) {
        throw { code: 'CONTACT_NOT_FOUND', message: 'Contato nao encontrado' }
      }

      // Passo 5: Validar opt-in
      if (!contact.optIn) {
        throw { code: 'CONTACT_NO_OPTIN', message: 'Contato sem opt-in confirmado' }
      }

      // Passo 6: Bloquear opt-out
      if (contact.status === ContactStatus.OPTOUT) {
        throw { code: 'CONTACT_OPTOUT', message: 'Contato em opt-out' }
      }

      // Passo 7: Validar status do contato
      if (contact.status === ContactStatus.INACTIVE) {
        throw { code: 'CONTACT_INACTIVE', message: 'Contato inativo' }
      }

      // Passo 8: Buscar instância
      const instance = await this.prisma.whatsAppInstance.findUnique({ where: { id: instanceId } })
      if (!instance) {
        throw { code: 'INSTANCE_NOT_FOUND', message: 'Instancia nao encontrada' }
      }

      // Passo 9: Validar instância conectada
      if (instance.status !== 'CONNECTED') {
        throw { code: 'INSTANCE_DISCONNECTED', message: `Instancia status: ${instance.status}` }
      }

      // Passo 10: Validar horário permitido
      const now = new Date()
      const [sh, sm] = campaign.allowedStartTime.split(':').map(Number)
      const [eh, em] = campaign.allowedEndTime.split(':').map(Number)
      const startDate = new Date(now)
      startDate.setHours(sh, sm, 0, 0)
      const endDate = new Date(now)
      endDate.setHours(eh, em, 0, 0)

      if (now < startDate || now > endDate) {
        throw { code: 'OUTSIDE_ALLOWED_TIME', message: `Fora do horário permitido: ${campaign.allowedStartTime}-${campaign.allowedEndTime}` }
      }

      // Passo 11: Validar limite diário por instância
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const sent = await this.prisma.messageLog.count({
        where: { campaignId, instanceId, status: 'SUCCESS', createdAt: { gte: today } },
      })

      if (sent >= campaign.dailyLimitPerInstance) {
        throw { code: 'DAILY_LIMIT_REACHED', message: `Limite diário (${campaign.dailyLimitPerInstance}) atingido` }
      }

      // Passo 12: Resolver conteúdo dinâmico
      const resolveResult = await this.dynamicContentResolver.resolveTemplate(
        campaign.userId,
        template.content,
        contact,
        { dryRun: false }, // Resolve real, não preview
      )

      renderedMeta = {
        templateOriginal: template.content,
        renderedText: resolveResult.renderedText,
        dynamicGroups: resolveResult.dynamicGroups,
        dynamicMedia: resolveResult.dynamicMedia,
        warnings: resolveResult.warnings,
        errors: resolveResult.errors,
      }

      // Passo 13: Validar se há erros na resolução
      if (resolveResult.errors.length > 0) {
        throw { code: 'DYNAMIC_RESOLUTION_ERROR', message: resolveResult.errors.join('; ') }
      }

      // Passo 14: Montar meio de envio (texto ou mídia)
      let textToSend = resolveResult.renderedText
      let primaryMedia = null

      // Verificar se há mídia dinâmica resolvi  da
      if (resolveResult.dynamicMedia.length > 0) {
        // Usar primeira mídia dinâmica como principal
        const firstDynamicMedia = resolveResult.dynamicMedia[0]
        primaryMedia = await this.prisma.mediaLibrary.findUnique({
          where: { id: firstDynamicMedia.mediaId },
        })

        if (!primaryMedia) {
          throw { code: 'DYNAMIC_MEDIA_INVALID', message: `Mídia dinamica nao encontrada: ${firstDynamicMedia.mediaId}` }
        }

        // Remover [Mídia: ...] do texto, deixar só o texto relevante
        textToSend = resolveResult.renderedText
          .replace(/\[Mídia: [^\]]+\]/g, '')
          .trim()

        if (resolveResult.dynamicMedia.length > 1) {
          renderedMeta.warnings.push(`Apenas primeira mídia será enviada. ${resolveResult.dynamicMedia.length - 1} mídias adicionais ignoradas.`)
        }
      }

      // Se não houver mídia dinâmica, usar mídia principal do template
      if (!primaryMedia && template.mediaId) {
        primaryMedia = await this.prisma.mediaLibrary.findUnique({ where: { id: template.mediaId } })
      }

      // Se não houver mídia no template, usar mídia estática da campanha
      if (!primaryMedia && mediaId) {
        primaryMedia = await this.prisma.mediaLibrary.findUnique({ where: { id: mediaId } })
      }

      // Passo 15: Enviar pela Evolution API
      let result
      if (primaryMedia && primaryMedia.type && primaryMedia.type !== 'TEXT') {
        const typeMap: any = { IMAGE: 'image', VIDEO: 'video', AUDIO: 'audio', DOCUMENT: 'document', PDF: 'document' }
        result = await this.evolution.sendMedia({
          instanceName: instance.instanceName,
          toNumber: phone,
          mediaType: typeMap[primaryMedia.type] || 'document',
          fileName: primaryMedia.fileName || 'media',
          caption: textToSend,
          mediaBase64OrUrl: primaryMedia.publicUrl || primaryMedia.filePath || '',
        })
      } else {
        result = await this.evolution.sendText(instance.instanceName, phone, textToSend)
      }

      // Passo 16: Registrar MessageLog com meta completo
      await this.prisma.messageLog.create({
        data: {
          userId: campaign.userId,
          campaignId,
          contactId,
          instanceId,
          direction: 'OUTBOUND',
          status: 'SUCCESS',
          meta: { ...renderedMeta, evolutionId: result?.id },
        },
      })

      this.logger.log(`[${campaignId}] Mensagem OK para ${phone}`)
      await this.checkPause(campaignId)
    } catch (err: any) {
      const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } })
      const errorCode = err?.code || 'EVOLUTION_SEND_ERROR'
      const errorMessage = err?.message || (err instanceof Error ? err.message : 'Erro desconhecido')

      // Registrar erro com contexto completo
      await this.prisma.messageLog.create({
        data: {
          userId: campaign?.userId || '',
          campaignId,
          contactId,
          instanceId,
          direction: 'OUTBOUND',
          status: 'ERROR',
          errorType: errorCode.substring(0, 50),
          errorMessage: errorMessage.substring(0, 255),
          meta: renderedMeta,
        },
      })

      this.logger.error(`[${campaignId}] [${errorCode}] Erro para ${phone}: ${errorMessage}`)
      await this.checkPause(campaignId)
      throw err
    }
  }

  private async checkPause(campaignId: string): Promise<void> {
    const c = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { messageLogs: true, contacts: true },
    })
    if (!c || c.status !== 'ACTIVE') return

    const logs = c.messageLogs
    const total = c.contacts.length
    if (total === 0) return

    const errors = logs.filter((l: any) => l.status === 'ERROR').length
    const rate = (errors / total) * 100

    if (rate > c.maxErrorRatePercent) {
      this.logger.warn(`[${campaignId}] Taxa ${rate.toFixed(2)}% excedeu, pausando`)
      await this.prisma.campaign.update({ where: { id: campaignId }, data: { status: 'PAUSED' } })
    }
  }

  async cancelCampaignMessages(campaignId: string): Promise<void> {
    const jobs = await this.campaignQueue.getJobs(['waiting', 'delayed', 'active'])
    for (const job of jobs) {
      if (job.data.campaignId === campaignId) {
        await job.remove()
      }
    }
    this.logger.log(`[${campaignId}] Mensagens canceladas`)
  }

  private calculateDelay(start: string, end: string, extra: number): number {
    const now = new Date()
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)

    const startDate = new Date(now)
    startDate.setHours(sh, sm, 0, 0)
    const endDate = new Date(now)
    endDate.setHours(eh, em, 0, 0)

    let next: Date
    if (now > endDate) {
      next = new Date(now)
      next.setDate(next.getDate() + 1)
      next.setHours(sh, sm, 0, 0)
    } else if (now < startDate) {
      next = startDate
    } else {
      next = now
    }

    next.setMilliseconds(next.getMilliseconds() + extra)
    return Math.max(0, next.getTime() - now.getTime())
  }
}
