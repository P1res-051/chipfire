import { z } from 'zod'

export const updateCampaignSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  description: z.string().optional(),
  allowedStartTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato: HH:mm').optional(),
  allowedEndTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato: HH:mm').optional(),
  dailyLimitPerInstance: z.number().int().min(1).max(10000).optional(),
  intervalMinSeconds: z.number().int().min(5).max(300).optional(),
  intervalMaxSeconds: z.number().int().min(5).max(300).optional(),
  maxErrorRatePercent: z.number().int().min(0).max(100).optional(),
  maxOptOutRatePercent: z.number().int().min(0).max(100).optional(),
})

export type UpdateCampaignDto = z.infer<typeof updateCampaignSchema>
