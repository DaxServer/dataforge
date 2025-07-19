import { t } from 'elysia'

// Single UUID regex pattern that accepts any valid UUID version with hyphens (case-insensitive)
export const UUID_REGEX =
  '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'

// RegExp version of UUID_REGEX for test matching
export const UUID_REGEX_PATTERN = new RegExp(UUID_REGEX, 'i')

export const ProjectResponseSchema = t.Object({
  id: t.String(),
  name: t.String(),
  created_at: t.String(),
  updated_at: t.String(),
})

export type Project = typeof ProjectResponseSchema.static

export const UUIDValidator = t.String({ pattern: UUID_REGEX })

export const UUIDParam = t.Object({
  id: UUIDValidator,
})

export const PaginationQuery = t.Object({
  offset: t.Optional(t.Numeric({ minimum: 0, default: 0 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 1000, default: 25 })),
})

export const DuckDBColumnSchema = t.Array(
  t.Object({
    name: t.String(),
    type: t.String(),
    pk: t.Boolean(),
  }),
)

export type DuckDBColumnSchema = typeof DuckDBColumnSchema.static
