import { Elysia } from 'elysia'
import cors from '@elysiajs/cors'
import { errorHandlerPlugin } from '@backend/plugins/error-handler'
import { databasePlugin } from '@backend/plugins/database'
import {
  importProject,
  importProjectFile,
  ProjectImportFileAltSchema,
  ProjectImportSchema,
} from '@backend/api/project/import'
import { createProject, ProjectCreateSchema } from '@backend/api/project/project.create'
import { deleteProject, ProjectDeleteSchema } from '@backend/api/project/project.delete'
import { getProjectById, GetProjectByIdSchema } from '@backend/api/project/project.get'
import { getAllProjects, ProjectsGetAllSchema } from '@backend/api/project/project.get-all'
import { importWithFile, ProjectImportFileSchema } from '@backend/api/project/project.import-file'

export const projectRoutes = new Elysia({ prefix: '/api/project' })
  .use(errorHandlerPlugin)
  .use(databasePlugin)
  .use(cors())
  .get('/', ({ db }) => getAllProjects(db), ProjectsGetAllSchema)
  .get(
    '/:id',
    ({ db, params, query, status }) =>
      getProjectById(db, params.id, query?.offset ?? 0, query?.limit ?? 0, status),
    GetProjectByIdSchema
  )
  .post('/', ({ db, body, status }) => createProject(db, body, status), ProjectCreateSchema)
  .delete(
    '/:id',
    ({ db, params, status }) => deleteProject(db, params.id, status),
    ProjectDeleteSchema
  )
  .post(
    '/:id/import',
    ({ db, params, body, status }) => importProject(db, params.id, body, status),
    ProjectImportSchema
  )
  .post(
    '/:id/import/file',
    ({ body, status }) => importProjectFile(body, status),
    ProjectImportFileAltSchema
  )
  .post(
    '/import',
    ({ db, body, status }) => importWithFile(db, body, status),
    ProjectImportFileSchema
  )
