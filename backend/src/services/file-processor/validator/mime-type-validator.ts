import type { FileMetadata } from '@backend/services/file-processor/types'
import type { UploadValidationError } from '@backend/types/wikibase-upload'

export const validateMimeType = (
  metadata: FileMetadata,
  allowedMimeTypes: string[],
): UploadValidationError[] => {
  const errors: UploadValidationError[] = []

  if (!allowedMimeTypes.includes(metadata.mimeType)) {
    errors.push({
      field: 'file',
      code: 'INVALID_MIME_TYPE',
      message: `MIME type ${metadata.mimeType} is not allowed`,
      details: {
        actualMimeType: metadata.mimeType,
        allowedMimeTypes,
      },
    })
  }

  return errors
}
