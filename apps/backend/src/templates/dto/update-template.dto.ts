import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateTemplateSchema = z.object({
  name: z.string().min(2).optional(),
  content: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
});

export class UpdateTemplateDto extends createZodDto(updateTemplateSchema) {}

