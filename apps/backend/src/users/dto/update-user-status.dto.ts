import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

export class UpdateUserStatusDto extends createZodDto(updateUserStatusSchema) {}

