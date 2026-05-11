import { z } from 'zod'

export const createTextMediaSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  tags: z.string().optional(),
})

export type CreateTextMediaDto = z.infer<typeof createTextMediaSchema>
