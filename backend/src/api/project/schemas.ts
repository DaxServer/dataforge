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

// Project schemas
// Base project properties
const projectBase = {
  name: t.String({
    minLength: 1,
    error: 'Project name is required and must be at least 1 character long',
  }),
  description: t.Optional(
    t.String({
      error: 'Project description must be a string',
    })
  ),
  config: t.Optional(
    t.Record(t.String(), t.Any(), {
      error: 'Project config must be a valid JSON object',
    })
  ),
}

const projectSchema = {
  create: {
    body: t.Object(projectBase),
    response: {
      201: t.Object({
        data: t.Object({
          id: t.String(),
          name: t.String(),
          description: t.Union([t.String(), t.Null()]),
          config: t.Union([t.Record(t.String(), t.Any()), t.Null()]),
          created_at: t.String(),
          updated_at: t.String(),
        }),
      }),
      422: errorResponseSchema,
      500: errorResponseSchema,
    },
  },
}

// Export types for use in handlers
export type CreateProjectInput = typeof projectSchema.create.body.static
export const CreateProjectSchema = projectSchema.create
