import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const adminSendTemplateSchema = z.object({
  originInstanceId: z.string().min(1),
  targetInstanceId: z.string().min(1),
  templateId: z.string().min(1),
})

export class AdminSendTemplateDto extends createZodDto(adminSendTemplateSchema) {}

