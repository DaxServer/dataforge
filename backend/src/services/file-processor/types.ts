import type { UploadValidationError } from '@backend/types/wikibase-upload'
import type { Metadata as SharpMetadata } from 'sharp'

export interface FileInput {
  type: 'filepath' | 'url'
  path?: string
  url?: string
  filename?: string
  mimeType?: string
}

export interface FileMetadata {
  filename: string
  size: number
  mimeType: string
  extension: string
  hash: string
  imageMetadata?: SharpMetadata
}

export interface ProcessedFile {
  metadata: FileMetadata
  buffer: Buffer
  isValid: boolean
  errors: UploadValidationError[]
}

export interface FileValidationOptions {
  maxFileSize: number
  allowedMimeTypes: string[]
  allowedExtensions: string[]
  requireDimensions: boolean
}
