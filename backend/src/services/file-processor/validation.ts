import type { FileMetadata, FileValidationOptions } from '@backend/services/file-processor/types'
import { validateExtension } from '@backend/services/file-processor/validator/extension-validator'
import { validateFileSize } from '@backend/services/file-processor/validator/file-size-validator'
import { validateMimeType } from '@backend/services/file-processor/validator/mime-type-validator'
import type { UploadValidationError } from '@backend/types/wikibase-upload'

export const defaultValidationOptions: FileValidationOptions = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/tiff',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'application/pdf',
  ],
  allowedExtensions: [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.svg',
    '.tiff',
    '.tif',
    '.mp4',
    '.webm',
    '.ogv',
    '.mp3',
    '.wav',
    '.ogg',
    '.pdf',
  ],
  requireDimensions: false,
}

export const validateFile = (
  metadata: FileMetadata,
  options: FileValidationOptions,
): UploadValidationError[] => {
  return [
    ...validateFileSize(metadata, options.maxFileSize),
    ...validateMimeType(metadata, options.allowedMimeTypes),
    ...validateExtension(metadata, options.allowedExtensions),
  ]
}
