import type { FileMetadata } from '@backend/services/file-processor/types'
import type { UploadValidationError } from '@backend/types/wikibase-upload'

export const validateFileSize = (
  metadata: FileMetadata,
  maxFileSize: number,
): UploadValidationError[] => {
  const errors: UploadValidationError[] = []

  if (metadata.size > maxFileSize) {
    errors.push({
      field: 'file',
      code: 'FILE_TOO_LARGE',
      message: `File size ${metadata.size} bytes exceeds maximum allowed size of ${maxFileSize} bytes`,
      details: {
        actualSize: metadata.size,
        maxSize: maxFileSize,
      },
    })
  }

  return errors
}
