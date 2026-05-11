import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CampaignExecutionService } from './campaign-execution.service'
import { CreateCampaignDto } from './dto/create-campaign.dto'
import { UpdateCampaignDto } from './dto/update-campaign.dto'
import { CampaignStatus, Prisma } from '@prisma/client'
import { DynamicContentResolverService } from '../dynamic-content/dynamic-content-resolver.service'

@Injectable()
export class CampaignsService {
  constructor(
    private prisma: PrismaService,
    private campaignExecution: CampaignExecutionService,
    private dynamicContentResolver: DynamicContentResolverService,
  ) {}

  private findDynamicGroupSlugs(content: string) {
    // aceita hífen e underscore (ex.: {{grupo:saudacao}} / {{grupo:saudacao_teste}})
    const regex = /\{\{grupo:([a-z0-9-_]+)\}\}/gi
    const slugs = new Set<string>()
    let m: RegExpExecArray | null
    while ((m = regex.exec(content))) {
      slugs.add(String(m[1]).toLowerCase())
    }
    return [...slugs]
  }

  private async validateDynamicGroupsForStart(userId: string, slugs: string[]) {
    const problems: string[] = []

    // evita múltiplas queries repetidas
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
        // dica mais clara quando o problema é mídia removida
        if (hasInvalidMedia) {
          problems.push(`Grupo {{grupo:${slug}}} possui mídia inválida ou removida.`)
        } else {
          problems.push(`Grupo {{grupo:${slug}}} não possui itens ativos.`)
        }
      }
    }

    return problems
  }

  async listCampaigns(
    userId: string,
    isAdmin: boolean,
    filters?: {
      status?: CampaignStatus
      limit?: number
      offset?: number
    },
  ) {
    const where: any = {}

    if (!isAdmin) {
      where.userId = userId
    }

    if (filters?.status) {
      where.status = filters.status
    }

    const limit = Math.min(filters?.limit || 50, 100)
    const offset = filters?.offset || 0

    const [campaigns, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        include: {
          template: {
            select: { id: true, name: true },
          },
          contacts: {
            select: { contactId: true },
          },
          instances: {
            select: { instanceId: true },
          },
          messageLogs: {
            select: {
              id: true,
              status: true,
              errorType: true,
            },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.campaign.count({ where }),
    ])

    return {
      items: campaigns.map((c: any) => ({
        ...c,
        contactCount: c.contacts.length,
        instanceCount: c.instances.length,
        sentCount: c.messageLogs.filter((ml: any) => ml.status === 'SUCCESS').length,
        errorCount: c.messageLogs.filter((ml: any) => ml.status === 'ERROR').length,
      })),
      total,
      limit,
      offset,
    }
  }

  async createCampaign(userId: string, dto: CreateCampaignDto) {
    const template = await this.prisma.messageTemplate.findUnique({
      where: { id: dto.templateId },
    })
    if (!template || template.userId !== userId) {
      throw new BadRequestException('Template invalido ou nao pertence a voce')
    }

    if (dto.mediaId) {
      const media = await this.prisma.mediaLibrary.findUnique({
        where: { id: dto.mediaId },
      })
      if (!media || media.userId !== userId) {
        throw new BadRequestException('Midia invalida ou nao pertence a voce')
      }
    }

    const instances = await this.prisma.whatsAppInstance.findMany({
      where: { id: { in: dto.instanceIds }, userId },
    })
    if (instances.length !== dto.instanceIds.length) {
      throw new BadRequestException(
        'Uma ou mais instancias nao existem ou nao pertencem a voce',
      )
    }

    const contacts = await this.prisma.contact.findMany({
      where: {
        userId,
        tag: dto.contactTag,
        status: 'ACTIVE',
        optIn: true,
      },
    })

    if (contacts.length === 0) {
      throw new BadRequestException(
        `Nenhum contato com opt-in confirmado encontrado para a etiqueta "${dto.contactTag}"`,
      )
    }

    if (dto.intervalMinSeconds > dto.intervalMaxSeconds) {
      throw new BadRequestException(
        'Intervalo minimo nao pode ser maior que maximo',
      )
    }

    const campaign = await this.prisma.campaign.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        contactTag: dto.contactTag,
        templateId: dto.templateId,
        mediaId: dto.mediaId,
        allowedStartTime: dto.allowedStartTime,
        allowedEndTime: dto.allowedEndTime,
        dailyLimitPerInstance: dto.dailyLimitPerInstance,
        intervalMinSeconds: dto.intervalMinSeconds,
        intervalMaxSeconds: dto.intervalMaxSeconds,
        maxErrorRatePercent: dto.maxErrorRatePercent,
        maxOptOutRatePercent: dto.maxOptOutRatePercent,
        status: 'DRAFT',
      },
    })

    await this.prisma.campaignInstance.createMany({
      data: dto.instanceIds.map((instanceId) => ({
        campaignId: campaign.id,
        instanceId,
      })),
    })

    await this.prisma.campaignContact.createMany({
      data: contacts.map((contact) => ({
        campaignId: campaign.id,
        contactId: contact.id,
      })),
    })

    return this.getCampaignById(campaign.id, userId)
  }

  async getCampaignById(id: string, userId: string, isAdmin = false) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        template: true,
        contacts: {
          include: {
            contact: {
              select: { id: true, name: true, phone: true, status: true },
            },
          },
        },
        instances: {
          include: {
            instance: {
              select: { id: true, instanceName: true, phoneNumber: true },
            },
          },
        },
        messageLogs: {
          select: {
            id: true,
            status: true,
            errorType: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    if (!campaign) {
      throw new NotFoundException('Campanha nao encontrada')
    }

    if (!isAdmin && campaign.userId !== userId) {
      throw new ForbiddenException('Acesso negado')
    }

    return campaign
  }

  /**
   * Dry-run/preview seguro (sem envio real):
   * - resolve variáveis normais + {{grupo:slug}} com dryRun=true
   * - NÃO incrementa usageCount/lastUsedAt
   * - salva MessageLog.meta com status=PREVIEW para auditoria
   */
  async dryRunCampaign(id: string, userId: string, isAdmin = false) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        template: true,
        contacts: {
          include: {
            contact: true,
          },
        },
        instances: true,
      },
    })

    if (!campaign) {
      throw new NotFoundException('Campanha nao encontrada')
    }

    if (!isAdmin && campaign.userId !== userId) {
      throw new ForbiddenException('Acesso negado')
    }

    const templateOriginal = campaign.template?.content ?? ''
    if (!templateOriginal.trim()) {
      throw new BadRequestException('Template da campanha está vazio')
    }

    const contact = campaign.contacts?.[0]?.contact
    if (!contact) {
      throw new BadRequestException('Nenhum contato elegível encontrado')
    }

    const instanceId = campaign.instances?.[0]?.instanceId ?? null

    const resolved = await this.dynamicContentResolver.resolveTemplate(
      campaign.userId,
      templateOriginal,
      contact,
      { dryRun: true },
    )

    const meta = {
      templateOriginal,
      renderedText: resolved.renderedText,
      dynamicGroups: resolved.dynamicGroups,
      dynamicMedia: resolved.dynamicMedia,
      warnings: resolved.warnings,
      errors: resolved.errors,
    }

    const log = await this.prisma.messageLog.create({
      data: {
        userId: campaign.userId,
        campaignId: campaign.id,
        contactId: contact.id,
        instanceId,
        direction: 'OUTBOUND',
        status: 'PREVIEW',
        meta: meta as unknown as Prisma.InputJsonValue,
      },
    })

    return {
      messageLogId: log.id,
      meta,
    }
  }

  async updateCampaign(id: string, userId: string, dto: UpdateCampaignDto, isAdmin = false) {
    const campaign = await this.getCampaignById(id, userId, isAdmin)

    if (campaign.status !== 'DRAFT') {
      throw new BadRequestException(
        'So e possivel editar campanhas em estado DRAFT',
      )
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        allowedStartTime: dto.allowedStartTime,
        allowedEndTime: dto.allowedEndTime,
        dailyLimitPerInstance: dto.dailyLimitPerInstance,
        intervalMinSeconds: dto.intervalMinSeconds,
        intervalMaxSeconds: dto.intervalMaxSeconds,
        maxErrorRatePercent: dto.maxErrorRatePercent,
        maxOptOutRatePercent: dto.maxOptOutRatePercent,
      },
      include: {
        template: true,
        contacts: { include: { contact: true } },
        instances: { include: { instance: true } },
        messageLogs: { take: 100, orderBy: { createdAt: 'desc' } },
      },
    })

    return updated
  }

  async deleteCampaign(id: string, userId: string, isAdmin = false) {
    const campaign = await this.getCampaignById(id, userId, isAdmin)

    if (campaign.status !== 'DRAFT') {
      throw new BadRequestException(
        'So e possivel deletar campanhas em estado DRAFT',
      )
    }

    await this.prisma.campaign.delete({
      where: { id },
    })

    return { success: true }
  }

  async startCampaign(id: string, userId: string, isAdmin = false) {
    const campaign = await this.getCampaignById(id, userId, isAdmin)

    if (campaign.status !== 'DRAFT') {
      throw new BadRequestException('So campanhas em DRAFT podem ser iniciadas')
    }

    const templateContent = (campaign as any)?.template?.content || ''
    const hasDynamicToken = /\{\{\s*grupo:/i.test(templateContent)
    const dynamicSlugs = this.findDynamicGroupSlugs(templateContent)
    if (dynamicSlugs.length) {
      const problems = await this.validateDynamicGroupsForStart(
        campaign.userId,
        dynamicSlugs,
      )

      if (problems.length) {
        throw new BadRequestException({
          message: 'Não é possível iniciar a campanha:',
          problems,
        })
      }
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: { status: 'ACTIVE' },
      include: {
        template: true,
        contacts: { include: { contact: true } },
        instances: { include: { instance: true } },
      },
    })

    // FASE 6: Agora suportamos conteúdo dinâmico {{grupo:slug}}
    // Enfileirar mensagens para ambas (estática e dinâmica)
    await this.campaignExecution.enqueueCampaignMessages(id)

    return updated
  }

  async pauseCampaign(id: string, userId: string, isAdmin = false) {
    const campaign = await this.getCampaignById(id, userId, isAdmin)

    if (campaign.status !== 'ACTIVE') {
      throw new BadRequestException('So campanhas em ACTIVE podem ser pausadas')
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: { status: 'PAUSED' },
      include: {
        template: true,
        contacts: { include: { contact: true } },
        instances: { include: { instance: true } },
      },
    })

    return updated
  }

  async stopCampaign(id: string, userId: string, isAdmin = false) {
    const campaign = await this.getCampaignById(id, userId, isAdmin)

    if (!['ACTIVE', 'PAUSED'].includes(campaign.status)) {
      throw new BadRequestException(
        'So campanhas em ACTIVE ou PAUSED podem ser paradas',
      )
    }

    await this.campaignExecution.cancelCampaignMessages(id)

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: { status: 'FINISHED' },
      include: {
        template: true,
        contacts: { include: { contact: true } },
        instances: { include: { instance: true } },
      },
    })

    return updated
  }

  async getCampaignMetrics(id: string, userId: string, isAdmin = false) {
    const campaign = await this.getCampaignById(id, userId, isAdmin)

    const logs = campaign.messageLogs

    const totalContacts = campaign.contacts.length
    const sent = logs.filter((l: any) => l.status === 'SUCCESS').length
    const failed = logs.filter((l: any) => l.status === 'ERROR').length
    const errorRate = totalContacts > 0 ? (failed / totalContacts) * 100 : 0

    return {
      campaignId: campaign.id,
      name: campaign.name,
      status: campaign.status,
      totalContacts,
      sent,
      failed,
      pending: totalContacts - sent - failed,
      errorRate: Math.round(errorRate),
      logs: logs.slice(0, 50).map((l: any) => ({
        id: l.id,
        status: l.status,
        errorType: l.errorType,
        createdAt: l.createdAt,
      })),
    }
  }

  async checkAndPauseCampaign(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { messageLogs: true, contacts: true },
    })

    if (!campaign || campaign.status !== 'ACTIVE') {
      return false
    }

    const logs = campaign.messageLogs
    const totalContacts = campaign.contacts.length

    if (totalContacts === 0) return false

    const errorCount = logs.filter((l: any) => l.status === 'ERROR').length
    const errorRate = (errorCount / totalContacts) * 100

    if (errorRate > campaign.maxErrorRatePercent) {
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'PAUSED' },
      })
      return true
    }

    return false
  }
}
