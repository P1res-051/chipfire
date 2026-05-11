import { z } from 'zod'

export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  contactTag: z.string().min(1, 'Etiqueta de contatos é obrigatória'),
  templateId: z.string().min(1, 'Template é obrigatório'),
  mediaId: z.string().optional(),
  instanceIds: z.array(z.string()).min(1, 'Selecione pelo menos uma instância'),
  allowedStartTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato: HH:mm').default('08:00'),
  allowedEndTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato: HH:mm').default('20:00'),
  dailyLimitPerInstance: z.number().int().min(1).max(10000).default(200),
  intervalMinSeconds: z.number().int().min(5).max(300).default(15),
  intervalMaxSeconds: z.number().int().min(5).max(300).default(60),
  maxErrorRatePercent: z.number().int().min(0).max(100).default(5),
  maxOptOutRatePercent: z.number().int().min(0).max(100).default(2),
})

export type CreateCampaignDto = z.infer<typeof createCampaignSchema>
