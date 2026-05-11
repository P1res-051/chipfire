import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ContentGroupType, ContentStatus } from '@prisma/client';

export const createContentGroupItemSchema = z.object({
  type: z.nativeEnum(ContentGroupType),
  textContent: z.string().min(1).max(5000).optional(),
  mediaId: z.string().min(1).optional(),
  weight: z.coerce.number().int().min(1).max(100).default(1),
  status: z.nativeEnum(ContentStatus).default(ContentStatus.ACTIVE),
});

export class CreateContentGroupItemDto extends createZodDto(createContentGroupItemSchema) {}

