import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createContactSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(8),
  tag: z.string().optional(),
  optIn: z.coerce.boolean().default(false),
  status: z.enum(['ACTIVE', 'INACTIVE', 'OPTOUT']).default('ACTIVE'),
});

export class CreateContactDto extends createZodDto(createContactSchema) {}

