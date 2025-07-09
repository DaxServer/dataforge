import { t } from 'elysia'
import { ApiErrorHandler } from '@backend/types/error-handler'
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

type ProjectImportFileBody = typeof ProjectImportFileAltSchema.body.static

export const importProjectFile = async (body: ProjectImportFileBody, status) => {
  try {
    // Generate a unique temporary file name
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const tempFileName = `temp_${timestamp}_${randomSuffix}.json`
    const tempFilePath = `./temp/${tempFileName}`

    // Convert file to buffer and save to temporary location
    const fileBuffer = await body.file.arrayBuffer()
    const uint8Array = new Uint8Array(fileBuffer)

    // Write the file to temporary location using Bun.write
    await Bun.write(tempFilePath, uint8Array)

    return status(201, {
      tempFilePath,
    })
  } catch (error) {
    return status(
      500,
      ApiErrorHandler.internalServerErrorWithData('Failed to save uploaded file', [
        (error as Error).message,
      ])
    )
  }
}
