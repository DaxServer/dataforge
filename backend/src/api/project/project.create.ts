import { t } from 'elysia'
import type { DuckDBConnection } from '@duckdb/node-api'
import { ApiErrorHandler } from '@backend/types/error-handler'
import { ProjectResponseSchema, type Project } from '@backend/api/project/_schemas'
import { ApiError } from '@backend/types/error-schemas'

export const ProjectCreateSchema = {
  body: t.Object({
    name: t.String({
      minLength: 1,
      error: 'Project name is required and must be at least 1 character long',
    }),
  }),
  response: {
    201: t.Object({
      data: ProjectResponseSchema,
    }),
    422: ApiError,
    500: ApiError,
  },
}

type ProjectCreateInput = typeof ProjectCreateSchema.body.static

export const createProject = async (
  db: () => DuckDBConnection,
  body: ProjectCreateInput,
  status
) => {
  // Insert the new project and get the inserted row in one operation
  const reader = await db().runAndReadAll(
    `INSERT INTO _meta_projects (name)
     VALUES (?)
     RETURNING *`,
    [body.name]
  )

  const projects = reader.getRowObjectsJson()

  if (projects.length === 0) {
    return status(
      500,
      ApiErrorHandler.databaseErrorWithData(
        'Failed to create project: No project returned from database'
      )
    )
  }

  return status(201, {
    data: projects[0] as Project,
  })
}
