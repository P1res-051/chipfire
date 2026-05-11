import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    const settings = await this.prisma.globalSettings.findUnique({
      where: { id: 'global' },
    });
    if (!settings) throw new BadRequestException('Configurações globais não inicializadas');
    return settings;
  }

  async update(data: Partial<{
    evolutionApiUrlInternal: string;
    evolutionApiUrlPublic: string;
    evolutionApiKeyHint: string | null;
    evolutionWebhookBaseUrl: string | null;
    evolutionTimeoutMs: number;
    evolutionMaxRetries: number;
    defaultDailyLimitPerInstance: number;
    defaultAllowedStartTime: string;
    defaultAllowedEndTime: string;
    defaultIntervalMinSeconds: number;
    defaultIntervalMaxSeconds: number;
    maxErrorRatePercent: number;
    maxOptOutRatePercent: number;
    maxMediaSizeMb: number;
    autoPauseOnInstability: boolean;
  }>) {
    const current = await this.get();
    return this.prisma.globalSettings.update({
      where: { id: current.id },
      data,
    });
  }
}

