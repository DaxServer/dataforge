import { Elysia } from 'elysia'

export const healthRoutes = new Elysia().get('/health', () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  uptime: Bun.nanoseconds() / 1_000_000_000,
}))
