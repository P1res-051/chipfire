import { z } from 'zod';

export const envSchema = z.object({
  BACKEND_PORT: z.coerce.number().default(3000),

  JWT_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().default(900),
  JWT_REFRESH_TTL_SECONDS: z.coerce.number().default(60 * 60 * 24 * 30),

  DATABASE_URL: z.string().min(1),

  REDIS_HOST: z.string().default('redis'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional().default(''),

  EVOLUTION_API_URL_INTERNAL: z.string().min(1),
  EVOLUTION_API_KEY: z.string().min(1),
  EVOLUTION_WEBHOOK_SECRET: z.string().min(8),

  // URL pública da API usada como base para registrar webhooks na Evolution API
  API_URL: z.string().default(''),

  MINIO_ENABLED: z.coerce.boolean().default(true),
  MINIO_ENDPOINT: z.string().default('http://minio:9000'),
  MINIO_ROOT_USER: z.string().default('minio'),
  MINIO_ROOT_PASSWORD: z.string().default('minio123'),
  MINIO_BUCKET: z.string().default('evo-crm'),
  MINIO_PUBLIC_URL: z.string().optional(),

  MAX_MEDIA_SIZE_MB: z.coerce.number().default(25),

  CORS_ORIGINS: z.string().optional(),

  LOG_LEVEL: z.string().default('info'),
  LOG_PRETTY: z.coerce.boolean().default(false),
});

export type Env = z.infer<typeof envSchema>;

