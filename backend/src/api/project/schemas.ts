import { t } from 'elysia'

// Single UUID regex pattern that accepts any valid UUID version with hyphens (case-insensitive)
export const UUID_REGEX =
  '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'

// RegExp version of UUID_REGEX for test matching
export const UUID_REGEX_PATTERN = new RegExp(UUID_REGEX, 'i')
export const UUIDPattern = t.String({
  pattern: UUID_REGEX,
})

export const ProjectResponseSchema = t.Object({
  id: t.String(),
  name: t.String(),
  created_at: t.String(),
  updated_at: t.String(),
})

export type Project = typeof ProjectResponseSchema.static

export const PaginationQuery = t.Object({
  offset: t.Number({ default: 0 }),
  limit: t.Number({ default: 25 }),
})

export const DuckDBColumnSchema = t.Array(
  t.Object({
    name: t.String(),
    type: t.String(),
    pk: t.Boolean(),
  }),
)

export type DuckDBColumnSchema = typeof DuckDBColumnSchema.static

export const ProjectParams = t.Object({
  projectId: UUIDPattern,
})

export const GetProjectByIdResponse = t.Object({
  data: t.Array(t.Any()),
  meta: t.Object({
    name: t.String(),
    schema: DuckDBColumnSchema,
    total: t.Number(),
    limit: t.Number(),
    offset: t.Number(),
  }),
})
export type GetProjectByIdResponse = typeof GetProjectByIdResponse.static

// Replace operation schema
export const ReplaceOperationSchema = t.Object({
  column: t.String({
    minLength: 1,
    error: 'Column name is required and must be at least 1 character long',
  }),
  find: t.String({
    minLength: 1,
    error: 'Find value is required and must be at least 1 character long',
  }),
  replace: t.String({
    default: '',
  }),
  caseSensitive: t.BooleanString({
    default: false,
  }),
  wholeWord: t.BooleanString({
    default: false,
  }),
})

// Trim whitespace operation schema
export const TrimWhitespaceSchema = t.Object({
  column: t.String({
    minLength: 1,
    error: 'Column name is required and must be at least 1 character long',
  }),
})
