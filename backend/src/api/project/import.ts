import { t } from 'elysia'
import type { DuckDBConnection } from '@duckdb/node-api'
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

type ProjectImportBody = typeof ProjectImportSchema.body.static

export const importProject = async (
  db: () => DuckDBConnection,
  id: string,
  body: ProjectImportBody,
  status
) => {
  const { filePath } = body

  if (!filePath) {
    return status(400, ApiErrorHandler.missingFilePathError())
  }

  const fileExists = await Bun.file(filePath).exists()

  if (!fileExists) {
    return status(400, ApiErrorHandler.fileNotFoundError(filePath))
  }

  // We'll check if the file exists but won't parse it
  // DuckDB's read_json_auto will handle the parsing

  // Check if a table with the same project ID already exists
  let tableExistsReader
  try {
    tableExistsReader = await db().runAndReadAll(
      `SELECT 1 FROM duckdb_tables() WHERE table_name = 'project_${id}'`
    )
  } catch (error) {
    return status(
      500,
      ApiErrorHandler.internalServerErrorWithData('An error occurred while importing the project', [
        (error as Error).message,
      ])
    )
  }

  if (tableExistsReader.getRows().length > 0) {
    return status(409, ApiErrorHandler.tableExistsErrorWithData(`project_${id}`))
  }

  // Try to create the table directly
  try {
    await db().run(`CREATE TABLE "project_${id}" AS SELECT * FROM read_json_auto('${filePath}')`)
    return status(201, new Response(null))
  } catch (error) {
    // Check if the error is related to JSON parsing
    const errorMessage = String(error)
    if (
      // errorMessage.includes('JSON') ||
      // errorMessage.includes('json') ||
      errorMessage.includes('parse') ||
      errorMessage.includes('Parse')
    ) {
      return status(
        400,
        ApiErrorHandler.invalidJsonErrorWithData('Invalid JSON format in uploaded file', [
          (error as Error).message,
        ])
      )
    }

    // Handle any other errors
    return status(
      500,
      ApiErrorHandler.internalServerErrorWithData('An error occurred while importing the project', [
        (error as Error).message,
      ])
    )
  }
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
