import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { Env } from '../config/env';

@Injectable()
export class EvolutionService {
  private readonly logger = new Logger(EvolutionService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly webhookSecret: string;

  constructor(
    private readonly http: HttpService,
    config: ConfigService<Env, true>,
  ) {
    this.baseUrl = config.get('EVOLUTION_API_URL_INTERNAL', { infer: true });
    this.apiKey = config.get('EVOLUTION_API_KEY', { infer: true });
    this.webhookSecret = config.get('EVOLUTION_WEBHOOK_SECRET', { infer: true });
  }

  private headers() {
    return { apikey: this.apiKey };
  }

  private summarizeResponse(data: any) {
    const keys =
      data && typeof data === 'object' ? Object.keys(data).slice(0, 30) : undefined;

    const count = typeof data?.count === 'number' ? data.count : undefined;
    const hasBase64 =
      typeof data?.base64 === 'string' ||
      typeof data?.qrcode?.base64 === 'string' ||
      typeof data?.qrcode === 'string';
    const hasCode = typeof data?.code === 'string' || typeof data?.pairingCode === 'string';

    return { keys, count, hasBase64, hasCode };
  }

  async createInstance(params: {
    instanceName: string;
    number?: string;
    qrcode?: boolean;
    token?: string;
    webhook?: string;
  }) {
    // Docs: POST /instance/create
    // https://doc.evolution-api.com/v1/api-reference/instance-controller/create-instance-basic
    // Enviar o payload mais "mínimo" possível para evitar quebra entre versões da Evolution.
    // (campos extras podem causar 400 dependendo do schema da versão)
    const body: Record<string, any> = {
      instanceName: params.instanceName,
      token: params.token ?? '',
      qrcode: params.qrcode ?? true,
      integration: 'WHATSAPP-BAILEYS',
    };
    if (params.number) body.number = params.number;
    // Nota: webhook NÃO vai no /instance/create — a Evolution API v2 retorna 400
    // quando os campos webhook_by_events/events estão no payload de criação.
    // O webhook é registrado separadamente via setWebhook() após a criação.

    try {
      const res = await firstValueFrom(
        this.http.post(`${this.baseUrl}/instance/create`, body, {
          headers: { ...this.headers(), 'Content-Type': 'application/json' },
          timeout: 60_000,
        }),
      );

      this.logger.debug(
        `[createInstance] instance=${params.instanceName} -> ${JSON.stringify(
          this.summarizeResponse(res.data),
        )}`,
      );

      if (params.webhook) {
        await this.setWebhook(params.instanceName, params.webhook);
      }

      return res.data;
    } catch (e: any) {
      const status = e?.response?.status;
      const data = e?.response?.data;
      this.logger.warn(
        `[createInstance] instance=${params.instanceName} failed status=${status} respKeys=${
          data && typeof data === 'object' ? Object.keys(data).join(',') : typeof data
        }`,
      );
      throw e;
    }
  }

  async setWebhook(instanceName: string, url: string) {
    try {
      const res = await firstValueFrom(
        this.http.post(
          `${this.baseUrl}/webhook/set/${encodeURIComponent(instanceName)}`,
          {
            webhook: {
              enabled: true,
              url,
              webhookByEvents: true,
              webhookBase64: false,
              events: ['QRCODE_UPDATED', 'CONNECTION_UPDATE', 'MESSAGES_UPSERT'],
              headers: { 'x-evo-secret': this.webhookSecret },
            },
          },
          { headers: { ...this.headers(), 'Content-Type': 'application/json' }, timeout: 10_000 },
        ),
      );
      this.logger.debug(`[setWebhook] instance=${instanceName} url=${url}`);
      return res.data;
    } catch (e: any) {
      // Não bloqueia a criação se o webhook falhar — instância já foi criada
      this.logger.warn(`[setWebhook] instance=${instanceName} failed: ${e?.message}`);
    }
  }

  async getQRCode(instanceName: string) {
    // Docs: GET /instance/connect/{instance}
    // https://doc.evolution-api.com/v1/api-reference/instance-controller/instance-connect
    const res = await firstValueFrom(
      this.http.get(`${this.baseUrl}/instance/connect/${encodeURIComponent(instanceName)}`, {
        headers: this.headers(),
        timeout: 15_000,
      }),
    );
    this.logger.debug(
      `[getQRCode] instance=${instanceName} -> ${JSON.stringify(
        this.summarizeResponse(res.data),
      )}`,
    );
    return res.data as any;
  }

  async deleteInstance(instanceName: string) {
    // Docs: DELETE /instance/delete/{instance}
    // https://doc.evolution-api.com/v1/api-reference/instance-controller/delete-instance
    const res = await firstValueFrom(
      this.http.delete(`${this.baseUrl}/instance/delete/${encodeURIComponent(instanceName)}`, {
        headers: this.headers(),
        timeout: 15_000,
      }),
    );
    return res.data;
  }

  async getConnectionState(instanceName: string) {
    // Docs: GET /instance/connectionState/{instance}
    // https://doc.evolution-api.com/v1/api-reference/instance-controller/connection-state
    const res = await firstValueFrom(
      this.http.get(
        `${this.baseUrl}/instance/connectionState/${encodeURIComponent(instanceName)}`,
        {
          headers: this.headers(),
          timeout: 15_000,
        },
      ),
    );
    this.logger.debug(
      `[getConnectionState] instance=${instanceName} -> ${JSON.stringify(
        this.summarizeResponse(res.data),
      )}`,
    );
    return res.data as { instance?: { instanceName?: string; state?: string } };
  }

  async restartInstance(instanceName: string) {
    // Docs: PUT /instance/restart/{instance}
    // https://doc.evolution-api.com/v1/api-reference/instance-controller/restart-instance
    const res = await firstValueFrom(
      this.http.put(
        `${this.baseUrl}/instance/restart/${encodeURIComponent(instanceName)}`,
        {},
        { headers: this.headers(), timeout: 15_000 },
      ),
    );
    return res.data;
  }

  async logoutInstance(instanceName: string) {
    // Docs: DELETE /instance/logout/{instance}
    // https://doc.evolution-api.com/v1/api-reference/instance-controller/logout-instance
    const res = await firstValueFrom(
      this.http.delete(
        `${this.baseUrl}/instance/logout/${encodeURIComponent(instanceName)}`,
        { headers: this.headers(), timeout: 15_000 },
      ),
    );
    return res.data;
  }

  async sendText(instanceName: string, toNumber: string, text: string) {
    // Docs: POST /message/sendText/{instance}
    // https://doc.evolution-api.com/v1/api-reference/message-controller/send-text
    const payload = {
      number: toNumber,
      text,
      textMessage: { text },
      options: { presence: 'composing', linkPreview: true },
    }

    try {
      const res = await firstValueFrom(
        this.http.post(
          `${this.baseUrl}/message/sendText/${encodeURIComponent(instanceName)}`,
          payload,
          {
            headers: { ...this.headers(), 'Content-Type': 'application/json' },
            timeout: 15_000,
          },
        ),
      )
      return res.data
    } catch (e: any) {
      const status = e?.response?.status
      const data = e?.response?.data
      this.logger.warn(
        `[sendText] instance=${instanceName} to=${toNumber} failed status=${status} response=${JSON.stringify(data)}`,
      )
      throw e
    }
  }

  async sendMedia(params: {
    instanceName: string;
    toNumber: string;
    mediaType: 'image' | 'video' | 'audio' | 'document';
    fileName: string;
    caption?: string;
    mediaBase64OrUrl: string;
    mimeType?: string | null;
  }) {
    if (params.mediaType === 'audio') {
      // Docs: POST /message/sendWhatsAppAudio/{instance}
      // https://doc.evolution-api.com/v2/api-reference/message-controller/send-audio
      const res = await firstValueFrom(
        this.http.post(
          `${this.baseUrl}/message/sendWhatsAppAudio/${encodeURIComponent(params.instanceName)}`,
          {
            number: params.toNumber,
            audio: params.mediaBase64OrUrl,
          },
          {
            headers: { ...this.headers(), 'Content-Type': 'application/json' },
            timeout: 30_000,
          },
        ),
      );
      return res.data;
    }

    // Docs: POST /message/sendMedia/{instance}
    // https://doc.evolution-api.com/v2/api-reference/message-controller/send-media
    const res = await firstValueFrom(
      this.http.post(
        `${this.baseUrl}/message/sendMedia/${encodeURIComponent(params.instanceName)}`,
        {
          number: params.toNumber,
          mediatype: params.mediaType,
          mimetype: params.mimeType ?? this.defaultMimeType(params.mediaType),
          caption: params.caption ?? '',
          media: params.mediaBase64OrUrl,
          fileName: params.fileName,
        },
        {
          headers: { ...this.headers(), 'Content-Type': 'application/json' },
          timeout: 30_000,
        },
      ),
    );
    return res.data;
  }

  private defaultMimeType(mediaType: 'image' | 'video' | 'audio' | 'document') {
    switch (mediaType) {
      case 'image':
        return 'image/jpeg';
      case 'video':
        return 'video/mp4';
      case 'audio':
        return 'audio/mpeg';
      default:
        return 'application/octet-stream';
    }
  }
}
