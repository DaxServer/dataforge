import { t } from 'elysia'

// Convert ErrorResponse interface to a schema
export const errorResponseSchema = t.Object({
  errors: t.Array(
    t.Object({
      code: t.String(),
      message: t.String(),
      details: t.Record(t.String(), t.Unknown()),
    })
  ),
})

// Shared project schema
const projectResponseSchema = t.Object({
  id: t.String(),
  name: t.String(),
  created_at: t.String(),
  updated_at: t.String(),
})

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
export type CreateProjectInput = typeof projectSchema.create.body.static

export const CreateProjectSchema = projectSchema.create
export const GetAllProjectsSchema = projectSchema.getAll
export const DeleteProjectSchema = projectSchema.delete
