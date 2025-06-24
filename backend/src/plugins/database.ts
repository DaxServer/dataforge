import { Elysia } from 'elysia'
import { DuckDBConnection, DuckDBInstance } from '@duckdb/node-api'

let connection: DuckDBConnection | null = null
let instance: DuckDBInstance | null = null

export const initializeDb = async (dbPath: string = 'openrefine.db'): Promise<DuckDBConnection> => {
  // Close existing connection if it exists
  if (connection) {
    connection.closeSync()
    connection = null
  }
  if (instance) {
    instance = null
  }

  // Create a new database instance
  instance = await DuckDBInstance.create(dbPath)

  // Connect to the database
  connection = await instance.connect()

  await connection.run(`CREATE TABLE IF NOT EXISTS _meta_projects (
  id UUID PRIMARY KEY DEFAULT uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`)

  return connection
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

export const databasePlugin = new Elysia({ name: 'database' })
  .decorate('dbConfig', { path: 'openrefine.db' })
  .onStart(async ({ decorator }) => {
    console.log('Initializing database...')
    await initializeDb(decorator.dbConfig.path)
    console.log('Database initialized successfully')
  })
  .decorate('db', getDb)
