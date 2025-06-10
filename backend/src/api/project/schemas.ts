import { t } from 'elysia'

export const ErrorSchema = t.Union([
  t.Object({
    code: t.Literal('VALIDATION'),
    message: t.Literal('Invalid file content'),
  }),
  t.Object({
    code: t.Literal('MISSING_FILE_PATH'),
    message: t.Literal('File path is required'),
  }),
  t.Object({
    code: t.Literal('MISSING_FILE'),
    message: t.Literal('File is required'),
  }),
  t.Object({
    code: t.Literal('INVALID_FILE_TYPE'),
    message: t.Literal('Only JSON files are supported'),
  }),
  t.Object({
    code: t.Literal('EMPTY_FILE'),
    message: t.Literal('File cannot be empty'),
  }),
  t.Object({
    code: t.Literal('FILE_NOT_FOUND'),
    message: t.Literal('File not found'),
    details: t.Object({
      filePath: t.String(),
    }),
  }),
  t.Object({
    code: t.Literal('TABLE_ALREADY_EXISTS'),
    message: t.String(),
  }),
])

// Convert ErrorResponse interface to a schema
export const errorResponseSchema = t.Object({
  errors: t.Array(ErrorSchema),
})

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
      400: errorResponseSchema,
      409: errorResponseSchema,
      500: errorResponseSchema,
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
      400: errorResponseSchema,
      409: errorResponseSchema,
      422: errorResponseSchema,
      500: errorResponseSchema,
    },
  },
}

// Project types
export type Project = typeof projectResponseSchema.static

// Base project properties for creation/update
const projectBase = {
  name: t.String({
    minLength: 1,
    error: 'Project name is required and must be at least 1 character long',
  }),
}

const projectSchema = {
  create: {
    body: t.Object(projectBase),
    response: {
      201: t.Object({
        data: projectResponseSchema,
      }),
      422: errorResponseSchema,
      500: errorResponseSchema,
    },
  },
  delete: {
    params: t.Object({
      id: t.String({
        pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
        error: 'ID must be a valid UUID',
      }),
    }),
    response: {
      204: t.Void(),
      404: errorResponseSchema,
      422: errorResponseSchema,
      500: errorResponseSchema,
    },
  },
  getAll: {
    response: {
      200: t.Object({
        data: t.Array(projectResponseSchema),
      }),
      500: errorResponseSchema,
    },
  },
}

// Export types for use in handlers
export const CreateProjectSchema = projectSchema.create
export type CreateProjectInput = typeof projectSchema.create.body.static

export const GetAllProjectsSchema = projectSchema.getAll
export const DeleteProjectSchema = projectSchema.delete

export const ImportProjectSchema = importSchema.import
export type ImportProjectInput = typeof importSchema.import.body.static

export const ImportFileProjectSchema = importSchema.importFile
export type ImportFileProjectInput = typeof importSchema.importFile.body.static
