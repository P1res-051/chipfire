import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateContactSchema = z.object({
  name: z.string().min(1).optional(),
  tag: z.string().nullable().optional(),
  optIn: z.coerce.boolean().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'OPTOUT']).optional(),
});

export class UpdateContactDto extends createZodDto(updateContactSchema) {}

