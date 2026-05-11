import { z } from 'zod'

export const uploadMediaSchema = z.object({
  tags: z.string().optional(),
})

export type UploadMediaDto = z.infer<typeof uploadMediaSchema>
