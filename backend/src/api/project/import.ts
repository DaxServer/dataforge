import { t, type Context } from 'elysia'
import { getDb } from '@backend/plugins/database'
import { ApiErrorHandler } from '@backend/types/error-handler'
import { ProjectUUIDParams } from '@backend/api/project/_schemas'
import { ErrorResponseWithDataSchema } from '@backend/types/error-schemas'

export const ProjectImportSchema = {
  params: ProjectUUIDParams,
  body: t.Object({
    filePath: t.String(),
  }),
  response: {
    201: t.Void(),
    400: ErrorResponseWithDataSchema,
    409: ErrorResponseWithDataSchema,
    422: ErrorResponseWithDataSchema,
    500: ErrorResponseWithDataSchema,
  },
}

type ProjectImportBody = typeof ProjectImportSchema.body.static

export const importProject = async ({
  params,
  body,
  set,
}: Context<{ params: typeof ProjectUUIDParams; body: ProjectImportBody }>) => {
  const { filePath } = body

  if (!filePath) {
    set.status = 400
    return ApiErrorHandler.missingFilePathError()
  }

  const fileExists = await Bun.file(filePath).exists()

  if (!fileExists) {
    set.status = 400
    return ApiErrorHandler.fileNotFoundError(filePath)
  }

  // We'll check if the file exists but won't parse it
  // DuckDB's read_json_auto will handle the parsing

  const db = getDb()

  // Check if a table with the same project ID already exists
  let tableExistsReader
  try {
    tableExistsReader = await db.runAndReadAll(
      `SELECT 1 FROM duckdb_tables() WHERE table_name = 'project_${params.id}'`
    )
  } catch (error) {
    set.status = 500
    return ApiErrorHandler.internalServerErrorWithData(
      'An error occurred while importing the project',
      [(error as Error).message]
    )
  }

  if (tableExistsReader.getRows().length > 0) {
    set.status = 409
    return ApiErrorHandler.tableExistsErrorWithData(`project_${params.id}`)
  }

  // Try to create the table directly
  try {
    await db.run(
      `CREATE TABLE "project_${params.id}" AS SELECT * FROM read_json_auto('${filePath}')`
    )
    set.status = 201
  } catch (error) {
    // Check if the error is related to JSON parsing
    const errorMessage = String(error)
    if (
      // errorMessage.includes('JSON') ||
      // errorMessage.includes('json') ||
      errorMessage.includes('parse') ||
      errorMessage.includes('Parse')
    ) {
      set.status = 400
      return {
        data: [],
        errors: [
          {
            code: 'VALIDATION',
            message: 'Error with JSON file',
            details: [(error as Error).message],
          },
        ],
      }
    }

    // Handle any other errors
    set.status = 500
    return ApiErrorHandler.internalServerErrorWithData(
      'An error occurred while importing the project',
      [(error as Error).message]
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
    400: ErrorResponseWithDataSchema,
    409: ErrorResponseWithDataSchema,
    422: ErrorResponseWithDataSchema,
    500: ErrorResponseWithDataSchema,
  },
}

type ProjectImportFileBody = typeof ProjectImportFileAltSchema.body.static

export const importProjectFile = async ({
  set,
  body,
}: Context<{
  body: ProjectImportFileBody
}>) => {
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

    set.status = 201
    return {
      tempFilePath,
    }
  } catch (error) {
    set.status = 500
    return ApiErrorHandler.internalServerErrorWithData('Failed to save uploaded file', [
      (error as Error).message,
    ])
  }
}
