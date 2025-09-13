import type { DuckDBConnection } from '@duckdb/node-api'

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
