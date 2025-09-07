import { ApiError } from '@backend/types/error-schemas'
import type { DuckDBConnection } from '@duckdb/node-api'
import { t } from 'elysia'

export const generateProjectName = (fileName: string) => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const timestamp = `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`
  const baseName = fileName.replace(/\.[^/.]+$/, '') // Remove extension
  return `${baseName}-${timestamp}`
}

export const cleanupProject = async (
  db: () => DuckDBConnection,
  projectId: string,
  tempFilePath?: string,
) => {
  await db().run('DELETE FROM _meta_projects WHERE id = ?', [projectId])

  if (tempFilePath) {
    await Bun.file(tempFilePath).delete()
  }
}

export const ProjectImportFileSchema = {
  body: t.Object({
    file: t.File({
      // Note: File type validation has known issues in Elysia 1.3.x
      // See: https://github.com/elysiajs/elysia/issues/1073
      // type: ['application/json'], // Temporarily disabled due to validation issues
      minSize: 1, // Reject empty files
    }),
    name: t.Optional(
      t.String({
        minLength: 1,
        maxLength: 255,
        error: 'Project name must be between 1 and 255 characters long if provided',
      }),
    ),
  }),
  response: {
    201: t.Object({
      data: t.Object({
        id: t.String(),
      }),
    }),
    400: ApiError,
    422: ApiError,
    500: ApiError,
  },
}
