import { t } from 'elysia'
import { ApiError } from '@backend/types/error-schemas'

export const ProjectDeleteSchema = {
  response: {
    204: t.Void(),
    404: ApiError,
    422: ApiError,
    500: ApiError,
  },
}
