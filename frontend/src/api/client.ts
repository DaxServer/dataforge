import { treaty } from "@elysiajs/eden"
import { type App } from "@/../backend/src/index"

// Create a type-safe API client using Elysia Eden
export const api = treaty<App>('http://localhost:8000')

// Export types for use in components
export type ApiClient = typeof api
export type ProjectResponse = Awaited<ReturnType<typeof api.project.get>>['data']
export type CreateProjectResponse = Awaited<ReturnType<typeof api.project.post>>['data']
export type ImportFileResponse = Awaited<ReturnType<typeof api.project({ id: '' }).import.file.post>>['data']
