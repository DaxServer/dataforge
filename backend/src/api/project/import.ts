import { t } from 'elysia'
import { ProjectUUIDParams } from '@backend/api/project/_schemas'
import { ApiError } from '@backend/types/error-schemas'

export const ProjectImportSchema = {
  params: ProjectUUIDParams,
  body: t.Object({
    filePath: t.String(),
  }),
  response: {
    201: t.Null(),
    400: ApiError,
    409: ApiError,
    422: ApiError,
    500: ApiError,
  },
}

export const ProjectImportFileAltSchema = {
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
    400: ApiError,
    409: ApiError,
    422: ApiError,
    500: ApiError,
  },
}
