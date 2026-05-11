import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ContentGroupType, ContentSelectionMode, ContentStatus } from '@prisma/client';

export const updateContentGroupSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).max(60).optional(),
  description: z.string().max(500).nullable().optional(),
  type: z.nativeEnum(ContentGroupType).optional(),
  selectionMode: z.nativeEnum(ContentSelectionMode).optional(),
  status: z.nativeEnum(ContentStatus).optional(),
});

export class UpdateContentGroupDto extends createZodDto(updateContentGroupSchema) {}

