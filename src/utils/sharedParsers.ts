import { z } from 'zod/v4'

export const standardPaginationQuerySchema = z.object({
  query: z.string('Invalid query').default(''),
  category: z.string('Invalid category').default(''),
  limit: z.string('Invalid limit').default('10'),
})

export const standardSearchQuerySchema = z.object({
  page: z.coerce.number('Invalid page').default(1),
  limit: z.coerce.number('Invalid limit').default(10),
  search: z.string('Invalid search').optional(),
  sort_by: z.string('Invalid sort_by').default('created_at'),
  sort_order: z.string('Invalid sort_order').default('desc'),
})
