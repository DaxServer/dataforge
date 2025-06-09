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
      errorMessage.includes('JSON') ||
      errorMessage.includes('json') ||
      errorMessage.includes('parse') ||
      errorMessage.includes('Parse')
    ) {
      set.status = 400
      return {
        errors: [
          {
            code: 'VALIDATION',
            message: 'Invalid file content',
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
          message: 'An error occurred while importing the project',
        },
      ],
    }
  }
}

export const importProjectFile = async ({ set }: Context) => {
  // File type validation is handled by Elysia schema validation
  // which returns 422 for invalid file types

  // For now, just return a 500 as we're still implementing the handler
  set.status = 500
  return {
    errors: [
      {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Handler not fully implemented yet',
      },
    ],
  }
}
