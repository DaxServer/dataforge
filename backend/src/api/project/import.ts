import { ApiErrors } from '@backend/types/error-schemas'
import { t } from 'elysia'
import z from 'zod'

export const ProjectImportSchema = {
  body: z.object({
    filePath: z.string(),
  }),
  response: {
    201: z.null(),
    400: ApiErrors,
    409: ApiErrors,
    422: ApiErrors,
    500: ApiErrors,
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
    201: z.object({
      tempFilePath: z.string(),
    }),
    400: ApiErrors,
    409: ApiErrors,
    422: ApiErrors,
    500: ApiErrors,
  },
}
