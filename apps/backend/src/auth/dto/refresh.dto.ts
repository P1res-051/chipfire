import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export class RefreshDto extends createZodDto(refreshSchema) {}

