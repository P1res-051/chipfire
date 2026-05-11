import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createInstanceSchema = z.object({
  instanceName: z
    .string()
    .min(3)
    .regex(/^[a-zA-Z0-9-_]+$/, 'Use apenas letras, números, - e _'),
  phoneNumber: z.string().optional(),
});

export class CreateInstanceDto extends createZodDto(createInstanceSchema) {}

