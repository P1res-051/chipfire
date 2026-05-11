import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Deve conter pelo menos 1 letra maiúscula')
    .regex(/[a-z]/, 'Deve conter pelo menos 1 letra minúscula')
    .regex(/[0-9]/, 'Deve conter pelo menos 1 número'),
});

export class ChangePasswordDto extends createZodDto(changePasswordSchema) {}

