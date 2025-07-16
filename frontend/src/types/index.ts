// API imports
import { treaty } from '@elysiajs/eden'
import { type App as ElysiaApp } from '@backend/index'

// Project file types
export type ProjectFile = File & { status: 'pending' | 'uploaded' }

// Event interfaces
export interface FileSelectEvent {
  files?: File[] | null
}

export interface FileRemoveEvent {
  file: File
}

// API types
export type ApiClient = ReturnType<typeof treaty<ElysiaApp>>

// Re-export schema mapping types
export * from './schema-mapping'

// Re-export drag and drop types
export * from './drag-drop'
