import { getDb } from '../../db'
import type { Context } from 'elysia'
import type { ImportProjectInput } from './schemas'

export const importProject = async ({
  params: { id },
  body,
  set,
}: Context<{ body: ImportProjectInput }>) => {
  const { filePath } = body

  if (!filePath) {
    set.status = 400
    return {
      errors: [
        {
          code: 'MISSING_FILE_PATH',
          message: 'File path is required',
        },
      ],
    }
  }

  const fileExists = await Bun.file(filePath).exists()

  if (!fileExists) {
    set.status = 400
    return {
      errors: [
        {
          code: 'FILE_NOT_FOUND',
          message: 'File not found',
          details: {
            filePath,
          },
        },
      ],
    }
  }

  // We'll check if the file exists but won't parse it
  // DuckDB's read_json_auto will handle the parsing

  const db = getDb()

  // Check if a table with the same project ID already exists
  let tableExistsReader
  try {
    tableExistsReader = await db.runAndReadAll(
      `SELECT 1 FROM duckdb_tables() WHERE table_name = 'project_${id}'`
    )
  } catch (error) {
    set.status = 500
    return {
      errors: [
        {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check if table exists',
          details: {
            error: (error as Error).message,
          },
        },
      ],
    }
  }

  if (tableExistsReader.getRows().length > 0) {
    set.status = 409
    return {
      errors: [
        {
          code: 'TABLE_ALREADY_EXISTS',
          message: `Table with name 'project_${id}' already exists`,
        },
      ],
    }
  }

  // Try to create the table directly
  try {
    await db.run(`CREATE TABLE "project_${id}" AS SELECT * FROM read_json_auto('${filePath}')`)
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
        errors: [
          {
            code: 'VALIDATION',
            message: 'Error with JSON file',
            details: {
              error: (error as Error).message,
            },
          },
        ],
      }
    }

    // Handle any other errors
    set.status = 500
    return {
      errors: [
        {
          code: 'INTERNAL_SERVER_ERROR',
          message: `An error occurred while importing the project`,
          details: {
            error: (error as Error).message,
          },
        },
      ],
    }
  }
}

export const importProjectFile = async ({ set, body }: Context) => {
  try {
    // File type validation is handled by Elysia schema validation
    // which returns 422 for invalid file types

    const { file } = body as { file: File }

    // Generate a unique temporary file name
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const tempFileName = `temp_${timestamp}_${randomSuffix}.json`
    const tempFilePath = `./temp/${tempFileName}`

    // Convert file to buffer and save to temporary location
    const fileBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(fileBuffer)
    const buffer = Buffer.from(uint8Array)

    // Write the file to temporary location using Bun.write <mcreference link="https://bun.sh/docs/api/file-io" index="1">1</mcreference>
    await Bun.write(tempFilePath, buffer)

    set.status = 201
    return {
      tempFilePath,
    }
  } catch (error) {
    set.status = 500
    return {
      errors: [
        {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save uploaded file',
          details: {
            error: (error as Error).message,
          },
        },
      ],
    }
  }
}
