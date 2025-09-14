import { ApiErrors } from '@backend/types/error-schemas'
import { t } from 'elysia'
import z from 'zod'

// Single UUID regex pattern that accepts any valid UUID version with hyphens (case-insensitive)
export const UUID_REGEX =
  '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'

// RegExp version of UUID_REGEX for test matching
export const UUID_REGEX_PATTERN = new RegExp(UUID_REGEX, 'i')
export const UUIDPattern = z.uuid()

export const ProjectResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type Project = z.infer<typeof ProjectResponseSchema>

export const PaginationQuery = z.object({
  offset: z.coerce.number().default(0).optional(),
  limit: z.coerce.number().default(25).optional(),
})

export const DuckDBColumnSchema = z.array(
  z.object({
    name: z.string(),
    type: z.string(),
    pk: z.boolean(),
  }),
)

export type DuckDBColumnSchema = z.infer<typeof DuckDBColumnSchema>

export const ProjectParams = z.object({
  projectId: UUIDPattern,
})

const tags = ['Project']

export const ProjectCreateSchema = {
  body: z.object({
    name: z
      .string({
        error: 'Project name is required and must be at least 1 character long',
      })
      .trim()
      .min(1),
  }),
  response: {
    201: z.object({
      data: ProjectResponseSchema,
    }),
    422: ApiErrors,
    500: ApiErrors,
  },
  detail: {
    summary: 'Create a new project',
    description: 'Create a new project',
    tags,
  },
}

export const ProjectsGetAllSchema = {
  response: {
    200: z.object({
      data: z.array(ProjectResponseSchema),
    }),
    422: ApiErrors,
    500: ApiErrors,
  },
  detail: {
    summary: 'Get all projects',
    description: 'Get all projects',
    tags,
  },
}

const ResponseSchema = z.object({
  data: z.array(z.any()),
  meta: z.object({
    name: z.string(),
    schema: DuckDBColumnSchema,
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
  }),
})

export const GetProjectByIdSchema = {
  query: PaginationQuery,
  response: {
    200: ResponseSchema,
    400: ApiErrors,
    404: ApiErrors,
    422: ApiErrors,
    500: ApiErrors,
  },
  detail: {
    summary: 'Get a project by ID',
    description: 'Get a project by ID',
    tags,
  },
}

export type GetProjectByIdResponse = z.infer<typeof ResponseSchema>

export const ProjectDeleteSchema = {
  response: {
    204: z.void(),
    404: ApiErrors,
    422: ApiErrors,
    500: ApiErrors,
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
    201: z.object({
      data: z.object({
        id: z.string(),
      }),
    }),
    400: ApiErrors,
    422: ApiErrors,
    500: ApiErrors,
  },
  detail: {
    summary: 'Import a file into a project',
    description: 'Import a file into a project',
    tags,
  },
}
