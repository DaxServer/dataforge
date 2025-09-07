import { ProjectResponseSchema } from '@backend/api/project/_schemas'
import { ApiError } from '@backend/types/error-schemas'
import { t } from 'elysia'

export const ProjectsGetAllSchema = {
  response: {
    200: t.Object({
      data: t.Array(ProjectResponseSchema),
    }),
    422: ApiError,
    500: ApiError,
  },
}
