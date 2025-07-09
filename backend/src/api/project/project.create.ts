import { t } from 'elysia'
import { ProjectResponseSchema } from '@backend/api/project/_schemas'
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
