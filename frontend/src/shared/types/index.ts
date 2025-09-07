// API imports
import { type App as ElysiaApp } from '@backend/index'
import { treaty } from '@elysiajs/eden'

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
