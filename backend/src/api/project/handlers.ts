import { getDb } from '../../db'

export const getAllProjects = async () => {
  const db = getDb()
  const reader = await db.runAndReadAll('SELECT * FROM _meta_projects ORDER BY created_at DESC')

  // Use DuckDB's built-in JSON conversion
  const projects = reader.getRowObjectsJson()

  return {
    data: projects,
  }
}
