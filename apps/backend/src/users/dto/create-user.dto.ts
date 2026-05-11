import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
  instanceLimit: z.coerce.number().int().min(0).max(100).default(1),
  notes: z.string().optional(),
});

export class CreateUserDto extends createZodDto(createUserSchema) {}

