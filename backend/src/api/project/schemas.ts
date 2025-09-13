import { ApiError } from '@backend/types/error-schemas'
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
  offset: t.Optional(
    t.Number({
      default: 0,
    }),
  ),
  limit: t.Optional(
    t.Number({
      default: 25,
    }),
  ),
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

const tags = ['Project']

export const ProjectCreateSchema = {
  body: t.Object({
    name: t.String({
      minLength: 1,
      maxLength: 255,
      error: 'Project name is required and must be between 1 and 255 characters long',
    }),
  }),
  response: {
    201: t.Object({
      data: ProjectResponseSchema,
    }),
    422: ApiError,
    500: ApiError,
  },
  detail: {
    summary: 'Create a new project',
    description: 'Create a new project',
    tags,
  },
}

export const ProjectsGetAllSchema = {
  response: {
    200: t.Object({
      data: t.Array(ProjectResponseSchema),
    }),
    422: ApiError,
    500: ApiError,
  },
  detail: {
    summary: 'Get all projects',
    description: 'Get all projects',
    tags,
  },
}

const ResponseSchema = t.Object({
  data: t.Array(t.Any()),
  meta: t.Object({
    name: t.String(),
    schema: DuckDBColumnSchema,
    total: t.Number(),
    limit: t.Number(),
    offset: t.Number(),
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
  detail: {
    summary: 'Get a project by ID',
    description: 'Get a project by ID',
    tags,
  },
}

export type GetProjectByIdResponse = typeof ResponseSchema.static

export const ProjectDeleteSchema = {
  response: {
    204: t.Void(),
    404: ApiError,
    422: ApiError,
    500: ApiError,
  },
  detail: {
    summary: 'Delete a project',
    description: 'Delete a project',
    tags,
  },
}

export const ProjectImportFileSchema = {
  body: t.Object({
    file: t.File({
      // Note: File type validation has known issues in Elysia 1.3.x
      // See: https://github.com/elysiajs/elysia/issues/1073
      // type: ['application/json'], // Temporarily disabled due to validation issues
      minSize: 1, // Reject empty files
    }),
    name: t.Optional(
      t.String({
        minLength: 1,
        maxLength: 255,
        error: 'Project name must be between 1 and 255 characters long if provided',
      }),
    ),
  }),
  response: {
    201: t.Object({
      data: t.Object({
        id: t.String(),
      }),
    }),
    400: ApiError,
    422: ApiError,
    500: ApiError,
  },
  detail: {
    summary: 'Import a file into a project',
    description: 'Import a file into a project',
    tags,
  },
}
