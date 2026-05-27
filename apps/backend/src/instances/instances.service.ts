import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContactStatus, InstanceStatus, MessageType, Prisma, UserRole } from '@prisma/client';

import { JwtPayload } from '../auth/jwt.payload';
import { Env } from '../config/env';
import { DynamicContentResolverService } from '../dynamic-content/dynamic-content-resolver.service'
import { EvolutionService } from '../evolution/evolution.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminSendTemplateDto } from './dto/admin-send-template.dto'

type NormalizedQrResponse =
  | {
      success: true;
      qrcode?: string; // sempre "data:image/png;base64,..." quando for imagem
      code?: string; // quando for pairing code/texto
      raw: any;
    }
  | {
      success: false;
      message: string;
      raw: any;
    };

function looksLikeBase64(value: string) {
  // Heurística simples: base64 costuma ser longo e só conter caracteres base64/URL-safe.
  if (!value || value.length < 80) return false;
  return /^[A-Za-z0-9+/=]+$/.test(value);
}

function normalizeQr(raw: any): NormalizedQrResponse {
  const candidates = [
    raw?.qrcode?.base64,
    raw?.qrcode,
    raw?.base64,
    raw?.data?.qrcode,
    raw?.data?.base64,
    raw?.instance?.qrcode,
    raw?.instance?.base64,
  ];

  const imageCandidate = candidates.find((v) => typeof v === 'string' && v.trim().length > 0) as
    | string
    | undefined;

  if (imageCandidate) {
    const trimmed = imageCandidate.trim();
    const qrcode = trimmed.startsWith('data:image')
      ? trimmed
      : looksLikeBase64(trimmed)
        ? `data:image/png;base64,${trimmed}`
        : undefined;

    // se não parece base64, não forçamos como imagem; pode ser apenas um texto
    if (qrcode) return { success: true, qrcode, raw };
  }

  const textCandidate =
    (typeof raw?.pairingCode === 'string' && raw.pairingCode.trim()) ||
    (typeof raw?.code === 'string' && raw.code.trim()) ||
    undefined;

  if (textCandidate) return { success: true, code: textCandidate, raw };

  const countInfo =
    typeof raw?.count === 'number' ? `count=${raw.count}` : 'sem campos esperados';
  return {
    success: false,
    message: `QR Code não disponível (${countInfo})`,
    raw,
  };
}

@Injectable()
export class InstancesService {
  private readonly logger = new Logger(InstancesService.name);
  private readonly webhookUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly evolution: EvolutionService,
    private readonly config: ConfigService<Env, true>,
    private readonly dynamicContentResolver: DynamicContentResolverService,
  ) {
    const apiUrl = this.config.get('API_URL', { infer: true });
    this.webhookUrl = apiUrl ? `${apiUrl}/webhooks/evolution` : '';
  }

  private renderInstanceTemplateVars(content: string, originName: string, targetName: string) {
    return String(content ?? '')
      .replaceAll('{{instancia_origem}}', originName)
      .replaceAll('{{instancia_destino}}', targetName)
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

  private normalizeMessageType(type: any): MessageType {
    const t = String(type ?? '').toUpperCase()
    if (t === 'IMAGE') return MessageType.IMAGE
    if (t === 'VIDEO') return MessageType.VIDEO
    if (t === 'AUDIO') return MessageType.AUDIO
    if (t === 'PDF' || t === 'DOCUMENT') return MessageType.DOCUMENT
    return MessageType.TEXT
  }

  async listForUser(user: JwtPayload) {
    if (user.role === UserRole.ADMIN) {
      const instances = await this.prisma.whatsAppInstance.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          maturationLogs: {
            take: 1,
            orderBy: { occurredAt: 'desc' },
          },
        },
      });
      return this.enrichWithMaturation(instances)
    }

    const instances = await this.prisma.whatsAppInstance.findMany({
      where: { userId: user.sub },
      orderBy: { createdAt: 'desc' },
      include: {
        maturationLogs: {
          take: 1,
          orderBy: { occurredAt: 'desc' },
        },
      },
    });
    return this.enrichWithMaturation(instances)
  }

  async listAdmin(filters: { userId?: string; status?: InstanceStatus } = {}) {
    const instances = await this.prisma.whatsAppInstance.findMany({
      where: {
        userId: filters.userId,
        status: filters.status,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, status: true, role: true } },
        maturationLogs: {
          take: 1,
          orderBy: { occurredAt: 'desc' },
        },
      },
    });
    return this.enrichWithMaturation(instances)
  }

  async createForUser(userId: string, input: { instanceName: string; phoneNumber?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const existingByName = await this.prisma.whatsAppInstance.findUnique({
      where: { userId_instanceName: { userId, instanceName: input.instanceName } },
    });
    if (existingByName) {
      // Permite "retry" quando ficou em ERROR (ex.: falha anterior na Evolution)
      if (existingByName.status === InstanceStatus.ERROR) {
        try {
          await this.evolution.createInstance({
            instanceName: existingByName.instanceName,
            number: input.phoneNumber,
            qrcode: true,
            webhook: this.webhookUrl || undefined,
          });
          return await this.prisma.whatsAppInstance.update({
            where: { id: existingByName.id },
            data: { status: InstanceStatus.WAITING_QR },
          });
        } catch (e: any) {
          throw new BadRequestException('Falha ao criar instância na Evolution API');
        }
      }

      throw new BadRequestException('Já existe uma instância com esse nome para este usuário');
    }

    const existingCount = await this.prisma.whatsAppInstance.count({ where: { userId } });
    if (existingCount >= user.instanceLimit) {
      throw new ForbiddenException('Limite de instâncias atingido para este usuário');
    }

    try {
      await this.evolution.createInstance({
        instanceName: input.instanceName,
        number: input.phoneNumber,
        qrcode: true,
        webhook: this.webhookUrl || undefined,
      });
    } catch (e: any) {
      throw new BadRequestException('Falha ao criar instância na Evolution API');
    }

    try {
      return await this.prisma.whatsAppInstance.create({
        data: {
          userId,
          instanceName: input.instanceName,
          phoneNumber: input.phoneNumber,
          status: InstanceStatus.WAITING_QR,
        },
      });
    } catch (e: any) {
      // se criou na Evolution mas falhou no banco, tenta desfazer na Evolution para não "sujar" ambiente
      try {
        await this.evolution.deleteInstance(input.instanceName);
      } catch {
        // ignore
      }
      throw e;
    }
  }

  async adminCreateForUser(input: { userId: string; instanceName: string; phoneNumber?: string }) {
    return this.createForUser(input.userId, {
      instanceName: input.instanceName,
      phoneNumber: input.phoneNumber,
    });
  }

  async getQRCode(user: JwtPayload, instanceId: string) {
    const instance = await this.prisma.whatsAppInstance.findUnique({ where: { id: instanceId } });
    if (!instance) throw new NotFoundException('Instância não encontrada');
    if (user.role !== UserRole.ADMIN && instance.userId !== user.sub) {
      throw new ForbiddenException('Acesso negado');
    }

    let raw = await this.evolution.getQRCode(instance.instanceName);

    // Em alguns cenários, a Evolution retorna {"count":0} enquanto a instância ainda está "close".
    // Tentar um restart e reconsultar evita o "QR nunca aparece" sem alterar outras áreas do sistema.
    if (raw?.count === 0) {
      this.logger.warn(
        `[getQRCode] instanceName=${instance.instanceName} returned count=0; trying restart then reconnect`,
      );
      try {
        await this.evolution.restartInstance(instance.instanceName);
      } catch (e) {
        this.logger.warn(
          `[getQRCode] restartInstance failed (continuing): ${
            (e as any)?.message ?? 'unknown error'
          }`,
        );
      }
      await new Promise((r) => setTimeout(r, 2000));
      raw = await this.evolution.getQRCode(instance.instanceName);
    }

    const normalized = normalizeQr(raw);

    const stored =
      normalized.success && normalized.qrcode
        ? normalized.qrcode
        : normalized.success && normalized.code
          ? normalized.code
          : null;

    this.logger.debug(
      `[getQRCode] instanceId=${instanceId} instanceName=${instance.instanceName} success=${
        normalized.success
      } stored=${stored ? 'yes' : 'no'} rawKeys=${
        raw && typeof raw === 'object' ? Object.keys(raw).join(',') : typeof raw
      }`,
    );

    await this.prisma.whatsAppInstance.update({
      where: { id: instanceId },
      data: { qrCode: stored, status: InstanceStatus.WAITING_QR },
    });

    return normalized;
  }

  async getStatus(user: JwtPayload, instanceId: string) {
    const instance = await this.prisma.whatsAppInstance.findUnique({ where: { id: instanceId } });
    if (!instance) throw new NotFoundException('Instância não encontrada');
    if (user.role !== UserRole.ADMIN && instance.userId !== user.sub) {
      throw new ForbiddenException('Acesso negado');
    }

    const state = await this.evolution.getConnectionState(instance.instanceName);
    return { instanceId, providerState: state?.instance?.state ?? 'unknown' };
  }

  async reconnect(user: JwtPayload, instanceId: string) {
    const instance = await this.prisma.whatsAppInstance.findUnique({ where: { id: instanceId } });
    if (!instance) throw new NotFoundException('Instância não encontrada');
    if (user.role !== UserRole.ADMIN && instance.userId !== user.sub) {
      throw new ForbiddenException('Acesso negado');
    }
    const result = await this.evolution.restartInstance(instance.instanceName);
    await this.prisma.whatsAppInstance.update({
      where: { id: instanceId },
      data: { status: InstanceStatus.WAITING_QR },
    });
    return result;
  }

  async disconnect(user: JwtPayload, instanceId: string) {
    const instance = await this.prisma.whatsAppInstance.findUnique({ where: { id: instanceId } });
    if (!instance) throw new NotFoundException('Instância não encontrada');
    if (user.role !== UserRole.ADMIN && instance.userId !== user.sub) {
      throw new ForbiddenException('Acesso negado');
    }
    const result = await this.evolution.logoutInstance(instance.instanceName);
    await this.prisma.whatsAppInstance.update({
      where: { id: instanceId },
      data: { status: InstanceStatus.DISCONNECTED, disconnectedAt: new Date() },
    });
    return result;
  }

  async delete(user: JwtPayload, instanceId: string) {
    const instance = await this.prisma.whatsAppInstance.findUnique({ where: { id: instanceId } });
    if (!instance) throw new NotFoundException('Instância não encontrada');
    if (user.role !== UserRole.ADMIN && instance.userId !== user.sub) {
      throw new ForbiddenException('Acesso negado');
    }

    try {
      await this.evolution.deleteInstance(instance.instanceName);
    } catch {
      // se a instância não existir/der erro na Evolution, ainda assim removemos do banco
    }
    await this.prisma.whatsAppInstance.delete({ where: { id: instanceId } });
    return { ok: true };
  }

  async adminSendTemplateToInstance(actor: JwtPayload, dto: AdminSendTemplateDto) {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas ADMIN pode enviar manualmente.')
    }

    const [origin, target, template] = await Promise.all([
      this.prisma.whatsAppInstance.findUnique({ where: { id: dto.originInstanceId } }),
      this.prisma.whatsAppInstance.findUnique({ where: { id: dto.targetInstanceId } }),
      this.prisma.messageTemplate.findUnique({ where: { id: dto.templateId } }),
    ])

    if (!origin) throw new NotFoundException('Instância de origem não encontrada')
    if (!target) throw new NotFoundException('Instância de destino não encontrada')
    if (!template) throw new NotFoundException('Template não encontrado')

    if (origin.status !== InstanceStatus.CONNECTED) {
      throw new BadRequestException('Instância de origem precisa estar CONNECTED')
    }
    if (!target.phoneNumber) {
      throw new BadRequestException('Instância de destino não possui phoneNumber')
    }

    const renderedBase = this.renderInstanceTemplateVars(template.content, origin.instanceName, target.instanceName)

    const fakeContact = {
      id: `manual-${target.id}`,
      userId: template.userId,
      name: target.instanceName,
      phone: target.phoneNumber,
      tag: 'manual-send',
      optIn: true,
      status: ContactStatus.ACTIVE,
      source: 'manual-send',
      optOutAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const resolved = await this.dynamicContentResolver.resolveTemplate(
      template.userId,
      renderedBase,
      fakeContact as any,
      { dryRun: true },
    )

    let textToSend = resolved.renderedText
      .replace(/\[M[ií]dia: [^\]]+\]/gi, '')
      .trim()

    // Prioridade de mídia: 1) primeira mídia dinâmica 2) mídia principal do template
    let media: null | {
      messageType: MessageType
      fileName: string
      urlOrRef: string
      mimeType?: string | null
    } = null

    const firstDynamic = resolved.dynamicMedia?.[0]
    if (firstDynamic?.mediaId) {
      const m = await this.prisma.mediaLibrary.findUnique({ where: { id: firstDynamic.mediaId } })
      if (m && (m.publicUrl || m.filePath) && m.type !== 'TEXT') {
        media = {
          messageType: this.normalizeMessageType(m.type),
          fileName: (m as any).fileName || m.name || 'media',
          urlOrRef: m.publicUrl || m.filePath || '',
          mimeType: m.mimeType,
        }
      }
    }

    if (!media && template.mediaId) {
      const m = await this.prisma.mediaLibrary.findUnique({ where: { id: template.mediaId } })
      if (m && (m.publicUrl || m.filePath) && m.type !== 'TEXT') {
        media = {
          messageType: this.normalizeMessageType(m.type),
          fileName: (m as any).fileName || m.name || 'media',
          urlOrRef: m.publicUrl || m.filePath || '',
          mimeType: m.mimeType,
        }
      }
    }

    let sendResult: any = null
    let status = 'SENT'
    let errorMessage: string | null = null

    try {
      if (media) {
        sendResult = await this.evolution.sendMedia({
          instanceName: origin.instanceName,
          toNumber: target.phoneNumber,
          mediaType: this.mapMediaType(media.messageType),
          fileName: media.fileName,
          caption: textToSend,
          mediaBase64OrUrl: media.urlOrRef,
          mimeType: media.mimeType,
        })
      } else {
        sendResult = await this.evolution.sendText(origin.instanceName, target.phoneNumber, textToSend)
      }
    } catch (e: any) {
      status = 'ERROR'
      errorMessage = e?.message ?? 'Falha ao enviar via Evolution'
      throw e
    } finally {
      const meta = {
        templateId: template.id,
        templateName: template.name,
        originInstanceId: origin.id,
        originInstanceName: origin.instanceName,
        targetInstanceId: target.id,
        targetInstanceName: target.instanceName,
        targetPhoneNumber: target.phoneNumber,
        renderedText: textToSend,
        dynamicGroups: resolved.dynamicGroups,
        dynamicMedia: resolved.dynamicMedia,
        evolution: sendResult,
      }

      await this.prisma.messageLog.create({
        data: {
          userId: actor.sub,
          instanceId: origin.id,
          direction: 'OUTBOUND',
          status,
          errorMessage,
          meta: meta as unknown as Prisma.InputJsonValue,
        },
      })
    }

    return { ok: true, evolution: sendResult }
  }

  private async enrichWithMaturation(instances: any[]) {
    if (instances.length === 0) return instances

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const counts = await this.prisma.instanceMaturationLog.groupBy({
      by: ['originInstanceId'],
      where: {
        originInstanceId: { in: instances.map((instance) => instance.id) },
        occurredAt: { gte: today },
        status: 'SENT',
      },
      _count: { _all: true },
    })

    const countsMap = new Map(counts.map((row) => [row.originInstanceId, row._count._all]))

    return instances.map((instance) => ({
      ...instance,
      maturationMessagesToday: countsMap.get(instance.id) ?? 0,
      lastMaturationLog: instance.maturationLogs?.[0] ?? null,
    }))
  }
}
