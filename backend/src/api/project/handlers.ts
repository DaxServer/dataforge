import { getDb } from '../../db'
import type { Context } from 'elysia'
import type { CreateProjectInput, Project, ImportWithFileInput } from './schemas'

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
    set.status = 500
    return {
      errors: [
        {
          code: 'DATABASE_ERROR',
          message: 'Failed to create project: No project returned from database',
        },
      ],
    }
  }

  set.status = 201
  return {
    data: projects[0] as Project,
  }
}

export const deleteProject = async ({ params, set }: Context<{ params: { id: string } }>) => {
  const db = getDb()

  // Delete the project and return the deleted row if it exists
  const reader = await db.runAndReadAll('DELETE FROM _meta_projects WHERE id = ? RETURNING id', [
    params.id,
  ])

  const deleted = reader.getRowObjectsJson()

  if (deleted.length === 0) {
    set.status = 404
    return new Response(null)
  }

  set.status = 204
}

const cleanupProject = async (db: any, projectId: string, tempFilePath?: string) => {
  await db.run('DELETE FROM _meta_projects WHERE id = ?', [projectId])
  if (tempFilePath) {
    await Bun.file(tempFilePath).delete()
  }
}

export const importWithFile = async ({
  body,
  set,
}: Context<{
  body: ImportWithFileInput
}>) => {
  const { file, name } = body

  const db = getDb()

  // Generate project name if not provided
  const projectName =
    name ||
    (() => {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')
      const timestamp = `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`
      const baseName = file.name.replace(/\.[^/.]+$/, '') // Remove extension
      return `${baseName}-${timestamp}`
    })()

  // Create the project
  const reader = await db.runAndReadAll(
    `INSERT INTO _meta_projects (name)
     VALUES (?)
     RETURNING *`,
    [projectName]
  )

  const projects = reader.getRowObjectsJson()
  if (projects.length === 0) {
    set.status = 500
    return {
      errors: [
        {
          code: 'PROJECT_CREATION_FAILED',
          message: 'Failed to create project: No project returned from database',
        },
      ],
    }
  }

  const project = projects[0] as Project

  // Save file to temporary location
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const tempFileName = `temp_${timestamp}_${randomSuffix}.json`
  const tempFilePath = `./temp/${tempFileName}`

  const fileBuffer = await file.arrayBuffer()
  const uint8Array = new Uint8Array(fileBuffer)
  const buffer = Buffer.from(uint8Array)

  await Bun.write(tempFilePath, buffer)

  // Parse JSON and handle syntax errors
  try {
    await Bun.file(tempFilePath).json()
  } catch (parseError) {
    await cleanupProject(db, project.id, tempFilePath)

    set.status = 400
    return {
      errors: [
        {
          code: 'INVALID_JSON',
          message: 'Invalid JSON format in uploaded file',
          details: {
            error: parseError instanceof Error ? parseError.message : 'JSON parsing failed',
          },
        },
      ],
    }
  }

  // Check if table already exists
  const tableExistsReader = await db.runAndReadAll(
    `SELECT 1 FROM duckdb_tables() WHERE table_name = 'project_${project.id}'`
  )

  if (tableExistsReader.getRows().length > 0) {
    // await cleanupProject(db, project.id, tempFilePath)

    set.status = 500
    return {
      errors: [
        {
          code: 'DATA_IMPORT_FAILED',
          message: `Table with name 'project_${project.id}' already exists`,
        },
      ],
    }
  }

  // Create table from JSON file
  await db.run(
    `CREATE TABLE "project_${project.id}" AS SELECT * FROM read_json_auto('${tempFilePath}')`
  )

  // Clean up temporary file
  await Bun.file(tempFilePath).delete()

  set.status = 201
  return {
    data: { id: project.id },
  }
}
