import { z } from 'zod'

export const listConversationsQuerySchema = z.object({
  userId: z.string().optional(),
  instanceId: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'OPTOUT']).optional(),
  tag: z.string().optional(),
  search: z.string().optional(), // busca por nome ou telefone
  dateStart: z.string().datetime().optional(),
  dateEnd: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  sortBy: z.enum(['lastMessageAt', 'createdAt']).default('lastMessageAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export type ListConversationsQuery = z.infer<typeof listConversationsQuerySchema>
