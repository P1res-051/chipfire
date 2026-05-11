import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ContentGroupType, ContentSelectionMode, ContentStatus } from '@prisma/client';

export const createContentGroupSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).max(60).optional(),
  description: z.string().max(500).optional(),
  type: z.nativeEnum(ContentGroupType),
  selectionMode: z.nativeEnum(ContentSelectionMode).default(ContentSelectionMode.RANDOM),
  status: z.nativeEnum(ContentStatus).default(ContentStatus.ACTIVE),
});

export class CreateContentGroupDto extends createZodDto(createContentGroupSchema) {}

