import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  instanceLimit: z.coerce.number().int().min(0).max(100).optional(),
  notes: z.string().nullable().optional(),
});

export class UpdateUserDto extends createZodDto(updateUserSchema) {}

