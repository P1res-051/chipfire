import { Body, Controller, Headers, Post, Req, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InstanceStatus, MessageDirection, MessageType } from '@prisma/client';

import { Env } from '../config/env';
import { normalizeBrazilPhone } from '../common/phone';
import { PrismaService } from '../prisma/prisma.service';

function pickInstanceName(payload: any): string | null {
  return (
    payload?.instance ??
    payload?.instanceName ??
    payload?.instance?.instanceName ??
    payload?.data?.instance ??
    payload?.data?.instanceName ??
    null
  );
}

function pickEventType(headers: Record<string, any>, payload: any): string {
  return (
    headers['x-evolution-event'] ??
    headers['x-webhook-event'] ??
    payload?.event ??
    payload?.eventType ??
    payload?.type ??
    'UNKNOWN'
  );
}

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Post('evolution')
  async evolution(
    @Req() req: any,
    @Headers() headers: Record<string, any>,
    @Body() body: any,
  ) {
    const secret = headers['x-evo-secret'] ?? headers['x-webhook-secret'];
    const expected = this.config.get('EVOLUTION_WEBHOOK_SECRET', { infer: true });
    if (!secret || secret !== expected) {
      throw new UnauthorizedException('Webhook secret inválido');
    }

    const instanceName = pickInstanceName(body);
    // Normaliza para UPPER_SNAKE independente do formato enviado pela Evolution:
    // "connection.update" → "CONNECTION_UPDATE", "messages.upsert" → "MESSAGES_UPSERT"
    const eventType = pickEventType(headers, body).toUpperCase().replace(/\./g, '_');

    const instance = instanceName
      ? await this.prisma.whatsAppInstance.findFirst({
          where: { instanceName },
        })
      : null;

    const webhook = await this.prisma.webhookEvent.create({
      data: {
        instanceId: instance?.id ?? null,
        eventType,
        raw: body ?? {},
      },
    });

    if (instance) {
      await this.prisma.whatsAppInstance.update({
        where: { id: instance.id },
        data: { lastActivityAt: new Date() },
      });
    }

    // Eventos comuns:
    // - QRCODE_UPDATED: atualiza qrCode
    // - CONNECTION_UPDATE / CONNECTION_STATE: atualiza status
    // - MESSAGES_UPSERT: salva mensagens
    try {
      if (instance && (eventType === 'QRCODE_UPDATED' || body?.data?.qrcode || body?.qrcode)) {
        const code = body?.data?.qrcode ?? body?.qrcode ?? body?.data?.code ?? body?.code;
        if (typeof code === 'string' && code.length > 10) {
          await this.prisma.whatsAppInstance.update({
            where: { id: instance.id },
            data: { qrCode: code, status: InstanceStatus.WAITING_QR },
          });
        }
      }

      if (instance && (eventType === 'CONNECTION_UPDATE' || eventType === 'CONNECTION_STATE')) {
        const state = body?.data?.state ?? body?.state ?? body?.data?.instance?.state;
        const status =
          state === 'open'
            ? InstanceStatus.CONNECTED
            : state === 'close'
              ? InstanceStatus.DISCONNECTED
              : InstanceStatus.ERROR;
        await this.prisma.whatsAppInstance.update({
          where: { id: instance.id },
          data: {
            status,
            connectedAt: status === InstanceStatus.CONNECTED ? new Date() : undefined,
            disconnectedAt: status === InstanceStatus.DISCONNECTED ? new Date() : undefined,
          },
        });
      }

      if (instance && (eventType === 'MESSAGES_UPSERT' || eventType === 'SEND_MESSAGE' || eventType === 'MESSAGES_UPDATE')) {
        const msg = body?.data?.message ?? body?.message ?? body?.data;
        const key = msg?.key ?? body?.data?.key ?? body?.key;
        const remoteJid: string | undefined = key?.remoteJid;
        const fromMe: boolean | undefined = key?.fromMe;
        const providerMessageId: string | undefined = key?.id ?? body?.data?.key?.id;

        const phone = remoteJid ? normalizeBrazilPhone(remoteJid.split('@')[0]) : '';
        const occurredAt = new Date();

        let contactId: string | null = null;
        if (phone && instance.userId) {
          const contact = await this.prisma.contact.upsert({
            where: { userId_phone: { userId: instance.userId, phone } },
            create: {
              userId: instance.userId,
              name: phone,
              phone,
              optIn: false,
              status: 'ACTIVE',
              source: 'WEBHOOK',
            },
            update: { updatedAt: new Date() },
          });
          contactId = contact.id;
        }

        if (contactId) {
          const conv = await this.prisma.conversation.upsert({
            where: { instanceId_contactId: { instanceId: instance.id, contactId } },
            create: { instanceId: instance.id, contactId, lastMessageAt: occurredAt },
            update: { lastMessageAt: occurredAt },
          });

          const direction = fromMe ? MessageDirection.OUTBOUND : MessageDirection.INBOUND;
          const text =
            msg?.message?.conversation ??
            msg?.message?.extendedTextMessage?.text ??
            msg?.message?.imageMessage?.caption ??
            msg?.message?.videoMessage?.caption ??
            msg?.message?.documentMessage?.caption ??
            null;

          await this.prisma.message.create({
            data: {
              conversationId: conv.id,
              contactId,
              instanceId: instance.id,
              direction,
              type: MessageType.TEXT,
              text,
              raw: body ?? {},
              providerMessageId,
              occurredAt,
            },
          });

          await this.prisma.whatsAppInstance.update({
            where: { id: instance.id },
            data: {
              messagesReceivedToday: direction === MessageDirection.INBOUND ? { increment: 1 } : undefined,
              messagesSentToday: direction === MessageDirection.OUTBOUND ? { increment: 1 } : undefined,
              totalMessagesReceived: direction === MessageDirection.INBOUND ? { increment: 1 } : undefined,
              totalMessagesSent: direction === MessageDirection.OUTBOUND ? { increment: 1 } : undefined,
              lastActivityAt: occurredAt,
            },
          });
        }
      }
    } catch {
      // Não falhar webhook por erro de parsing/DB - apenas persistimos raw e seguimos
    }

    return { ok: true, webhookEventId: webhook.id };
  }
}

