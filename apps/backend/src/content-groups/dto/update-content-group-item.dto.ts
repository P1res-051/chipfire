import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ContentGroupType, ContentStatus } from '@prisma/client';

export const updateContentGroupItemSchema = z.object({
  type: z.nativeEnum(ContentGroupType).optional(),
  textContent: z.string().min(1).max(5000).nullable().optional(),
  mediaId: z.string().min(1).nullable().optional(),
  weight: z.coerce.number().int().min(1).max(100).optional(),
  status: z.nativeEnum(ContentStatus).optional(),
});

export class UpdateContentGroupItemDto extends createZodDto(updateContentGroupItemSchema) {}

