import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { Env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async onModuleInit() {
    await this.ensureGlobalSettings();
    await this.ensureDefaultAdmin();
  }

  private async ensureDefaultAdmin() {
    const email = 'admin@local.com';
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) return;

    const passwordHash = await bcrypt.hash('Admin@123456', 12);

    await this.prisma.user.create({
      data: {
        name: 'Admin',
        email,
        passwordHash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        instanceLimit: 50,
        mustChangePassword: true,
        notes: 'Admin padrão criado automaticamente no primeiro start.',
      },
    });

    this.logger.warn(
      'Admin padrão criado: admin@local.com / Admin@123456 (troca obrigatória no 1º login)',
    );
  }

  private async ensureGlobalSettings() {
    const exists = await this.prisma.globalSettings.findUnique({
      where: { id: 'global' },
    });
    if (exists) return;

    await this.prisma.globalSettings.create({
      data: {
        id: 'global',
        evolutionApiUrlInternal: this.config.get('EVOLUTION_API_URL_INTERNAL', {
          infer: true,
        }),
        evolutionApiUrlPublic:
          this.config.get('EVOLUTION_API_URL_INTERNAL', { infer: true }),
        evolutionApiKeyHint: 'Configurado via .env (não armazenamos o segredo em texto puro).',
        evolutionTimeoutMs: 15000,
        evolutionMaxRetries: 3,
        defaultDailyLimitPerInstance: 200,
        defaultAllowedStartTime: '08:00',
        defaultAllowedEndTime: '20:00',
        defaultIntervalMinSeconds: 15,
        defaultIntervalMaxSeconds: 60,
        maxErrorRatePercent: 5,
        maxOptOutRatePercent: 2,
        maxMediaSizeMb: this.config.get('MAX_MEDIA_SIZE_MB', { infer: true }),
        autoPauseOnInstability: true,
      },
    });
  }
}

