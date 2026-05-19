import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createTemplateSchema = z.object({
  name: z.string().min(2),
  content: z.string().default(''),
  mediaId: z.string().min(1).optional().nullable(),
  tags: z.array(z.string()).default([]),
}).refine((value) => Boolean(value.content.trim()) || Boolean(value.mediaId), {
  message: 'Informe texto ou selecione uma mídia principal',
  path: ['content'],
});

export class CreateTemplateDto extends createZodDto(createTemplateSchema) {}

