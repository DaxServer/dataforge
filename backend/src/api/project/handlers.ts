import { getDb } from '../../db'
import type { Context } from 'elysia'
import type { CreateProjectInput, Project } from './schemas'

export const getAllProjects = async () => {
  const db = getDb()
  const reader = await db.runAndReadAll('SELECT * FROM _meta_projects ORDER BY created_at DESC')

  const projects = reader.getRowObjectsJson()

  return {
    data: projects as Project[],
  }
}

export const createProject = async ({
  body,
  set,
}: Context<{
  body: CreateProjectInput
}>) => {
  const db = getDb()

  // Insert the new project and get the inserted row in one operation
  const reader = await db.runAndReadAll(
    `INSERT INTO _meta_projects (name)
     VALUES (?)
     RETURNING *`,
    [body.name]
  )

  const projects = reader.getRowObjectsJson()

  if (projects.length === 0) {
    throw Object.assign(new Error('Failed to create project: No project returned from database'), {
      code: 'DATABASE_ERROR',
    })
  }

  const project = projects[0]

  set.status = 201
  return {
    data: project as Project,
  }
}
