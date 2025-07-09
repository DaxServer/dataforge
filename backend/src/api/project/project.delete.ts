import { t } from 'elysia'
import { ApiError } from '@backend/types/error-schemas'
import { ProjectUUIDParams } from '@backend/api/project/_schemas'

export const ProjectDeleteSchema = {
  params: ProjectUUIDParams,
  response: {
    204: t.Null(),
    404: ApiError,
    422: ApiError,
    500: ApiError,
  },
}
