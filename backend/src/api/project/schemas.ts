import { t } from 'elysia'
import { ErrorResponseWithDataSchema } from '@backend/types/error-schemas'

// Single UUID regex pattern that accepts any valid UUID version with hyphens (case-insensitive)
export const UUID_REGEX =
  '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'

// RegExp version of UUID_REGEX for test matching
export const UUID_REGEX_PATTERN = new RegExp(UUID_REGEX, 'i')

// Shared project schema
const projectResponseSchema = t.Object({
  id: t.String(),
  name: t.String(),
  created_at: t.String(),
  updated_at: t.String(),
})

export const importSchema = {
  import: {
    params: t.Object({
      id: t.String(),
    }),
    body: t.Object({
      filePath: t.String(),
    }),
    response: {
      201: t.Void(),
      400: ErrorResponseWithDataSchema,
      409: ErrorResponseWithDataSchema,
      422: ErrorResponseWithDataSchema,
      500: ErrorResponseWithDataSchema,
    },
  },
  importFile: {
    params: t.Object({
      id: t.String(),
    }),
    body: t.Object({
      file: t.File({
        // Note: File type validation has known issues in Elysia 1.3.x
        // See: https://github.com/elysiajs/elysia/issues/1073
        // type: ['application/json'], // Temporarily disabled due to validation issues
        minSize: 1, // Reject empty files
      }),
    }),
    response: {
      201: t.Object({
        tempFilePath: t.String(),
      }),
      400: ErrorResponseWithDataSchema,
      409: ErrorResponseWithDataSchema,
      422: ErrorResponseWithDataSchema,
      500: ErrorResponseWithDataSchema,
    },
  },
  importWithFile: {
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
        })
      ),
    }),
    response: {
      201: t.Object({
        data: t.Object({
          id: t.String(),
        }),
      }),
      400: ErrorResponseWithDataSchema,
      422: ErrorResponseWithDataSchema,
      500: ErrorResponseWithDataSchema,
    },
  },
}

// Project types
export type Project = typeof projectResponseSchema.static

const projectSchema = {
  create: {
    body: t.Object({
      name: t.String({
        minLength: 1,
        error: 'Project name is required and must be at least 1 character long',
      }),
    }),
    response: {
      201: t.Object({
        data: projectResponseSchema,
      }),
      422: ErrorResponseWithDataSchema,
      500: ErrorResponseWithDataSchema,
    },
  },
  getById: {
    params: t.Object({
      id: t.String({
        pattern: UUID_REGEX,
        error: 'ID must be a valid UUID',
      }),
    }),
    response: {
      200: t.Object({
        data: t.Array(t.Any()),
        meta: t.Object({
          name: t.String(),
          schema: t.Array(
            t.Object({
              name: t.String(),
              type: t.String(),
            })
          ),
          total: t.Number(),
          limit: t.Number(),
          offset: t.Number(),
        }),
      }),
      400: ErrorResponseWithDataSchema,
      404: ErrorResponseWithDataSchema,
      422: ErrorResponseWithDataSchema,
      500: ErrorResponseWithDataSchema,
    },
  },
  delete: {
    params: t.Object({
      id: t.String({
        pattern: UUID_REGEX,
        error: 'ID must be a valid UUID',
      }),
    }),
    response: {
      204: t.Void(),
      404: ErrorResponseWithDataSchema,
      422: ErrorResponseWithDataSchema,
      500: ErrorResponseWithDataSchema,
    },
  },
  getAll: {
    response: {
      200: t.Object({
        data: t.Array(projectResponseSchema),
      }),
      500: ErrorResponseWithDataSchema,
    },
  },
}

// Export types for use in handlers
export const CreateProjectSchema = projectSchema.create
export type CreateProjectInput = typeof projectSchema.create.body.static

export const GetAllProjectsSchema = projectSchema.getAll

export const GetProjectByIdSchema = projectSchema.getById
export type GetProjectByIdInput = typeof projectSchema.getById.params.static

export const DeleteProjectSchema = projectSchema.delete

export const ImportProjectSchema = importSchema.import
export type ImportProjectInput = typeof importSchema.import.body.static

export const ImportFileProjectSchema = importSchema.importFile
export type ImportFileProjectInput = typeof importSchema.importFile.body.static

export const ImportWithFileSchema = importSchema.importWithFile
export type ImportWithFileInput = typeof importSchema.importWithFile.body.static
