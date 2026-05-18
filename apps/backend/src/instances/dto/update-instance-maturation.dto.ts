import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const updateInstanceMaturationSchema = z.object({
  enabled: z.coerce.boolean(),
})

export class UpdateInstanceMaturationDto extends createZodDto(updateInstanceMaturationSchema) {}
