import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const updateInstanceMaturationConfigSchema = z
  .object({
    messagesPerCycle: z.coerce.number().int().min(1).max(10),
    dailyLimit: z.coerce.number().int().min(1).max(500),
    intervalMinSeconds: z.coerce.number().int().min(15).max(3600),
    intervalMaxSeconds: z.coerce.number().int().min(15).max(3600),
    contentGroupSlugs: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  })
  .refine((value) => value.intervalMaxSeconds >= value.intervalMinSeconds, {
    message: 'Intervalo maximo deve ser maior ou igual ao minimo',
    path: ['intervalMaxSeconds'],
  })

export class UpdateInstanceMaturationConfigDto extends createZodDto(
  updateInstanceMaturationConfigSchema,
) {}
