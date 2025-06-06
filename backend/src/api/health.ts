import { Elysia } from 'elysia'

export const healthRoutes = new Elysia().get('/health', () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
}))
