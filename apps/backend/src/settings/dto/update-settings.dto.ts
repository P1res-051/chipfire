import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateSettingsSchema = z.object({
  evolutionApiUrlInternal: z.string().url().optional(),
  evolutionApiUrlPublic: z.string().url().optional(),
  evolutionApiKeyHint: z.string().nullable().optional(),
  evolutionWebhookBaseUrl: z.string().url().nullable().optional(),
  evolutionTimeoutMs: z.coerce.number().int().min(1000).max(120000).optional(),
  evolutionMaxRetries: z.coerce.number().int().min(0).max(10).optional(),

  defaultDailyLimitPerInstance: z.coerce.number().int().min(0).max(5000).optional(),
  defaultAllowedStartTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  defaultAllowedEndTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  defaultIntervalMinSeconds: z.coerce.number().int().min(0).max(3600).optional(),
  defaultIntervalMaxSeconds: z.coerce.number().int().min(0).max(3600).optional(),

  maxErrorRatePercent: z.coerce.number().int().min(0).max(100).optional(),
  maxOptOutRatePercent: z.coerce.number().int().min(0).max(100).optional(),
  maxMediaSizeMb: z.coerce.number().int().min(1).max(100).optional(),
  autoPauseOnInstability: z.coerce.boolean().optional(),
});

export class UpdateSettingsDto extends createZodDto(updateSettingsSchema) {}

