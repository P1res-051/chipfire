"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envSchema = void 0;
var zod_1 = require("zod");
exports.envSchema = zod_1.z.object({
    BACKEND_PORT: zod_1.z.coerce.number().default(3000),
    JWT_SECRET: zod_1.z.string().min(16),
    JWT_REFRESH_SECRET: zod_1.z.string().min(16),
    JWT_ACCESS_TTL_SECONDS: zod_1.z.coerce.number().default(900),
    JWT_REFRESH_TTL_SECONDS: zod_1.z.coerce.number().default(60 * 60 * 24 * 30),
    DATABASE_URL: zod_1.z.string().min(1),
    REDIS_HOST: zod_1.z.string().default('redis'),
    REDIS_PORT: zod_1.z.coerce.number().default(6379),
    REDIS_PASSWORD: zod_1.z.string().optional().default(''),
    EVOLUTION_API_URL_INTERNAL: zod_1.z.string().min(1),
    EVOLUTION_API_KEY: zod_1.z.string().min(1),
    EVOLUTION_WEBHOOK_SECRET: zod_1.z.string().min(8),
    MINIO_ENABLED: zod_1.z.coerce.boolean().default(true),
    MINIO_ENDPOINT: zod_1.z.string().default('http://minio:9000'),
    MINIO_ROOT_USER: zod_1.z.string().default('minio'),
    MINIO_ROOT_PASSWORD: zod_1.z.string().default('minio123'),
    MINIO_BUCKET: zod_1.z.string().default('evo-crm'),
    MINIO_PUBLIC_URL: zod_1.z.string().optional(),
    MAX_MEDIA_SIZE_MB: zod_1.z.coerce.number().default(25),
    CORS_ORIGINS: zod_1.z.string().optional(),
    LOG_LEVEL: zod_1.z.string().default('info'),
    LOG_PRETTY: zod_1.z.coerce.boolean().default(false),
});
