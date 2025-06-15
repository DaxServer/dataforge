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

  // Read and execute the SQL file using Bun's file API
  const sqlPath = Bun.resolveSync('../sql/create_projects_table.sql', import.meta.dir)
  const sql = await Bun.file(sqlPath).text()

  await connection.run(sql)

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
  .onStart(async ({ dbConfig }) => {
    console.log('Initializing database...')
    await initializeDb(dbConfig.path)
    console.log('Database initialized successfully')
  })
  .decorate('db', getDb)
