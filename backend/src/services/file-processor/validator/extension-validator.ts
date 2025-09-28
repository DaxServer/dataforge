import type { FileMetadata } from '@backend/services/file-processor/types'
import type { UploadValidationError } from '@backend/types/wikibase-upload'

export const validateExtension = (
  metadata: FileMetadata,
  allowedExtensions: string[],
): UploadValidationError[] => {
  const errors: UploadValidationError[] = []

  if (!allowedExtensions.includes(metadata.extension.toLowerCase())) {
    errors.push({
      field: 'file',
      code: 'INVALID_EXTENSION',
      message: `File extension ${metadata.extension} is not allowed`,
      details: {
        actualExtension: metadata.extension,
        allowedExtensions,
      },
    })
  }

  return errors
}
