import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createTemplateSchema = z.object({
  name: z.string().min(2),
  content: z.string().min(1),
  tags: z.array(z.string()).default([]),
});

export class CreateTemplateDto extends createZodDto(createTemplateSchema) {}

