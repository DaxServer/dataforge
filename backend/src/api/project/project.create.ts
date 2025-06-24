import { t, type Context } from 'elysia'
import { getDb } from '@backend/plugins/database'
import { ApiErrorHandler } from '@backend/types/error-handler'
import { ProjectResponseSchema, type Project } from '@backend/api/project/_schemas'
import { ErrorResponseWithDataSchema } from '@backend/types/error-schemas'

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
    422: ErrorResponseWithDataSchema,
    500: ErrorResponseWithDataSchema,
  },
}

type ProjectCreateInput = typeof ProjectCreateSchema.body.static

export const createProject = async ({
  body,
  set,
}: Context<{
  body: ProjectCreateInput
}>) => {
  const db = getDb()

  // Insert the new project and get the inserted row in one operation
  const reader = await db.runAndReadAll(
    `INSERT INTO _meta_projects (name)
     VALUES (?)
     RETURNING *`,
    [body.name]
  )

  const projects = reader.getRowObjectsJson()

  if (projects.length === 0) {
    set.status = 500
    return ApiErrorHandler.databaseErrorWithData(
      'Failed to create project: No project returned from database'
    )
  }

  set.status = 201
  return {
    data: projects[0] as Project,
  }
}
