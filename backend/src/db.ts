import { DuckDBConnection, DuckDBInstance } from '@duckdb/node-api'
import path from 'path'

let connection: DuckDBConnection | null = null
let instance: DuckDBInstance | null = null

export const initializeDb = async (dbPath: string = 'openrefine.db'): Promise<DuckDBConnection> => {
  if (connection) return connection

  try {
    // Create a new database instance
    instance = await DuckDBInstance.create(dbPath)

    // Connect to the database
    connection = await instance.connect()

    // Read and execute the SQL file using Bun's file API
    const sqlPath = path.join(import.meta.dir, 'sql', 'create_projects_table.sql')
    const sql = await Bun.file(sqlPath).text()

    await connection.run(sql)

    console.log('🦆 DuckDB connected successfully')

    return connection
  } catch (error) {
    console.error('Failed to initialize DuckDB:', error)
    throw error
  }
}

export const getDb = (): DuckDBConnection => {
  if (!connection) {
    throw new Error('Database not initialized. Call initializeDb() first.')
  }
  return connection
}

export const closeDb = async (): Promise<void> => {
  if (connection) {
    connection.closeSync()
    connection = null
  }
  instance = null
}
