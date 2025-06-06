import { Elysia } from 'elysia'
import { getAllProjects } from './handlers'

export const projectRoutes = new Elysia({ prefix: '/project' }).get('/', getAllProjects)
