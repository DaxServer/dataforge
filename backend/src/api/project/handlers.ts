import { getDb } from '../../db'
import type { Context } from 'elysia'
import { type CreateProjectInput } from './schemas'

export const getAllProjects = async () => {
  const db = getDb()
  const reader = await db.runAndReadAll('SELECT * FROM _meta_projects ORDER BY created_at DESC')

  // Use DuckDB's built-in JSON conversion
  const projects = reader.getRowObjectsJson()

  return {
    data: projects,
  }
}

export const createProject = async ({
  body,
  set,
}: Context<{
  body: CreateProjectInput
}>) => {
  const db = getDb()

  // Convert config to JSON string if it exists
  const configJson = body.config ? JSON.stringify(body.config) : null

  // Insert the new project and get the inserted row in one operation
  const reader = await db.runAndReadAll(
    `INSERT INTO _meta_projects (name, description, config)
     VALUES (?, ?, ?)
     RETURNING *`,
    [body.name, body.description || null, configJson]
  )

  const projects = reader.getRowObjectsJson()
  const project = projects[0]

  if (!project) {
    const error = new Error('Failed to create project: No project returned from database')
    ;(error as any).code = 'DATABASE_ERROR'
    throw error
  }

  // Parse the config back to an object for the response
  if (project.config && typeof project.config === 'string') {
    project.config = JSON.parse(project.config)
  }

  set.status = 201
  return { data: project }
}
