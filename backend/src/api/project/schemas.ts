import { t } from 'elysia'

// Single UUID regex pattern that accepts any valid UUID version with hyphens (case-insensitive)
export const UUID_REGEX =
  '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'

// RegExp version of UUID_REGEX for test matching
export const UUID_REGEX_PATTERN = new RegExp(UUID_REGEX, 'i')

export const ErrorSchema = t.Union([
  t.Object({
    code: t.Literal('VALIDATION'),
    message: t.String(),
  }),
  t.Object({
    code: t.Literal('MISSING_FILE_PATH'),
    message: t.String(),
  }),
  t.Object({
    code: t.Literal('MISSING_FILE'),
    message: t.String(),
  }),
  t.Object({
    code: t.Literal('INVALID_FILE_TYPE'),
    message: t.String(),
  }),
  t.Object({
    code: t.Literal('EMPTY_FILE'),
    message: t.String(),
  }),
  t.Object({
    code: t.Literal('FILE_NOT_FOUND'),
    message: t.String(),
    details: t.Object({
      filePath: t.String(),
    }),
  }),
  t.Object({
    code: t.Literal('TABLE_ALREADY_EXISTS'),
    message: t.String(),
  }),
  t.Object({
    code: t.Literal('INTERNAL_SERVER_ERROR'),
    message: t.String(),
  }),
  t.Object({
    code: t.Literal('DATABASE_ERROR'),
    message: t.String(),
  }),
  t.Object({
    code: t.Literal('PROJECT_CREATION_FAILED'),
    message: t.String(),
  }),
  t.Object({
    code: t.Literal('DATA_IMPORT_FAILED'),
    message: t.String(),
  }),
  t.Object({
    code: t.Literal('INVALID_JSON'),
    message: t.String(),
  }),
  t.Object({
    code: t.Literal('NOT_FOUND'),
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
      400: errorResponseSchema,
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
          total: t.Number(),
          limit: t.Number(),
          offset: t.Number(),
        }),
      }),
      400: errorResponseSchema,
      404: errorResponseSchema,
      422: errorResponseSchema,
      500: errorResponseSchema,
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
export const GetProjectByIdSchema = projectSchema.getById
export const DeleteProjectSchema = projectSchema.delete

export const ImportProjectSchema = importSchema.import
export type ImportProjectInput = typeof importSchema.import.body.static

export const ImportFileProjectSchema = importSchema.importFile
export type ImportFileProjectInput = typeof importSchema.importFile.body.static

export const ImportWithFileSchema = importSchema.importWithFile
export type ImportWithFileInput = typeof importSchema.importWithFile.body.static
