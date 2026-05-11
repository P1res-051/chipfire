import { z } from 'zod'

export const updateMediaSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  tags: z.string().optional(),
})

export type UpdateMediaDto = z.infer<typeof updateMediaSchema>
