import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { Env } from '../config/env';

@Injectable()
export class EvolutionService {
  private readonly logger = new Logger(EvolutionService.name);
  private readonly baseUrl: string;
  private readonly publicApiBaseUrl: string;
  private readonly internalApiBaseUrl: string;
  private readonly apiKey: string;
  private readonly webhookSecret: string;
  private readonly minioEndpoint: string;
  private readonly minioPublicUrl?: string;

  constructor(
    private readonly http: HttpService,
    config: ConfigService<Env, true>,
  ) {
    this.baseUrl = config.get('EVOLUTION_API_URL_INTERNAL', { infer: true });
    this.publicApiBaseUrl = config.get('API_URL', { infer: true }).replace(/\/api\/?$/, '');
    this.internalApiBaseUrl = config.get('API_INTERNAL_URL', { infer: true }).replace(/\/api\/?$/, '');
    this.apiKey = config.get('EVOLUTION_API_KEY', { infer: true });
    this.webhookSecret = config.get('EVOLUTION_WEBHOOK_SECRET', { infer: true });
    this.minioEndpoint = config.get('MINIO_ENDPOINT', { infer: true });
    this.minioPublicUrl = config.get('MINIO_PUBLIC_URL', { infer: true }) || undefined;
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
    const media = this.normalizeMediaUrl(params.mediaBase64OrUrl);

    if (params.mediaType === 'audio') {
      // Docs: POST /message/sendWhatsAppAudio/{instance}
      // https://doc.evolution-api.com/v2/api-reference/message-controller/send-audio
      const res = await firstValueFrom(
        this.http.post(
          `${this.baseUrl}/message/sendWhatsAppAudio/${encodeURIComponent(params.instanceName)}`,
          {
            number: params.toNumber,
            audio: media,
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
          media,
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

  private normalizeMediaUrl(media: string) {
    if (!media) return media;

    // Nosso storage pode persistir referências internas (não-URL) no banco como fallback:
    // - local://<filename>
    // - minio://<bucket>/<key>
    // A Evolution API precisa receber uma URL http(s) ou base64.
    if (media.startsWith('local://')) {
      const fileName = media.replace('local://', '');
      const base = this.internalApiBaseUrl || this.publicApiBaseUrl;
      if (!base) return media;
      return `${base}/storage/uploads/${fileName}`;
    }

    if (media.startsWith('minio://')) {
      // minio://bucket/key
      const withoutScheme = media.replace('minio://', '');
      const firstSlash = withoutScheme.indexOf('/');
      const bucket = firstSlash >= 0 ? withoutScheme.slice(0, firstSlash) : withoutScheme;
      const key = firstSlash >= 0 ? withoutScheme.slice(firstSlash + 1) : '';
      const endpoint = (this.minioEndpoint || '').replace(/\/+$/, '');
      if (!endpoint || !bucket || !key) return media;
      return `${endpoint}/${bucket}/${key}`;
    }

    // Caminhos relativos (ex: /storage/uploads/...) precisam virar URL absoluta
    if (media.startsWith('/')) {
      const base = this.internalApiBaseUrl || this.publicApiBaseUrl;
      if (!base) return media;
      return `${base}${media}`;
    }

    // URLs absolutas: ajustar quando o host "público" não é acessível pela Evolution API (container).
    try {
      const url = new URL(media);

      // Se a mídia veio com MINIO_PUBLIC_URL (ex: http://localhost:9000),
      // trocar para o endpoint interno (ex: http://minio:9000) para a Evolution conseguir baixar.
      if (this.minioPublicUrl) {
        const pub = this.minioPublicUrl.replace(/\/+$/, '');
        const internal = this.minioEndpoint.replace(/\/+$/, '');
        if (media.startsWith(pub + '/')) {
          return internal + media.slice(pub.length);
        }
      }

      // Se a URL aponta para localhost/127.0.0.1, isso não resolve dentro do container da Evolution.
      // Se API_INTERNAL_URL estiver configurada, reescreve o host.
      if (
        this.internalApiBaseUrl &&
        (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
      ) {
        const base = new URL(this.internalApiBaseUrl);
        url.protocol = base.protocol;
        url.host = base.host;
        return url.toString();
      }

      return media;
    } catch {
      return media;
    }
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
