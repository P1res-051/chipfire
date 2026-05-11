import { z } from 'zod'

export const updateConversationSchema = z.object({
  tag: z.string().optional(),
  notes: z.string().optional(),
})

export type UpdateConversationDto = z.infer<typeof updateConversationSchema>
