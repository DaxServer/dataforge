import { DuckDBColumnSchema, PaginationQuery } from '@backend/api/project/_schemas'
import { ApiError } from '@backend/types/error-schemas'
import { t } from 'elysia'

const ResponseSchema = t.Object({
  data: t.Array(t.Any()),
  meta: t.Object({
    name: t.String(),
    schema: DuckDBColumnSchema,
    total: t.Number(),
    limit: t.Numeric(),
    offset: t.Numeric(),
  }),
})

export const GetProjectByIdSchema = {
  query: PaginationQuery,
  response: {
    200: ResponseSchema,
    400: ApiError,
    404: ApiError,
    422: ApiError,
    500: ApiError,
  },
}

export type GetProjectByIdResponse = typeof ResponseSchema.static
