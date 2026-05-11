import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const adminCreateInstanceSchema = z.object({
  userId: z.string().min(1),
  instanceName: z
    .string()
    .min(3)
    .regex(/^[a-zA-Z0-9-_]+$/, 'Use apenas letras, números, - e _'),
  phoneNumber: z.string().optional(),
});

export class AdminCreateInstanceDto extends createZodDto(adminCreateInstanceSchema) {}

