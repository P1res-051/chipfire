import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

import { Env } from '../config/env';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        connection: {
          host: config.get('REDIS_HOST', { infer: true }),
          port: config.get('REDIS_PORT', { infer: true }),
          password: config.get('REDIS_PASSWORD', { infer: true }) || undefined,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 200,
          removeOnFail: 200,
        },
      }),
    }),
    BullModule.registerQueue(
      { name: 'message-send-queue' },
      { name: 'webhook-processing-queue' },
      { name: 'media-processing-queue' },
      { name: 'report-export-queue' },
      { name: 'health-score-queue' },
      { name: 'campaign-execution-queue' },
    ),
  ],
})
export class QueuesModule {}

