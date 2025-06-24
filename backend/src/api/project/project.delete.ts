import { t, type Context } from 'elysia'
import { getDb } from '@backend/plugins/database'
import { ApiErrorHandler } from '@backend/types/error-handler'
import { ErrorResponseWithDataSchema } from '@backend/types/error-schemas'
import { ProjectUUIDParams } from '@backend/api/project/_schemas'

export const ProjectDeleteSchema = {
  params: ProjectUUIDParams,
  response: {
    204: t.Void(),
    404: ErrorResponseWithDataSchema,
    422: ErrorResponseWithDataSchema,
    500: ErrorResponseWithDataSchema,
  },
}

type ProjectDeleteParams = typeof ProjectDeleteSchema.params.static

export const deleteProject = async ({
  params,
  set,
}: Context<{
  params: ProjectDeleteParams
}>) => {
  const db = getDb()

  // Delete the project and return the deleted row if it exists
  const reader = await db.runAndReadAll('DELETE FROM _meta_projects WHERE id = ? RETURNING id', [
    params.id,
  ])

  const deleted = reader.getRowObjectsJson()

  if (deleted.length === 0) {
    set.status = 404
    return ApiErrorHandler.notFoundErrorWithData('Project')
  }

  set.status = 204
}
