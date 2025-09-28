import { extractFileBuffer } from '@backend/services/file-processor/file-buffer-extractor'
import { buildFileMetadata } from '@backend/services/file-processor/metadata-builder'
import type {
  FileInput,
  FileValidationOptions,
  ProcessedFile,
} from '@backend/services/file-processor/types'
import { defaultValidationOptions, validateFile } from '@backend/services/file-processor/validation'

export const processFile = async (
  uploadFile: FileInput,
  options: Partial<FileValidationOptions> = {},
): Promise<ProcessedFile> => {
  const validationOptions = { ...defaultValidationOptions, ...options }

  const { buffer, size, filename } = await extractFileBuffer(uploadFile)
  const metadata = await buildFileMetadata(buffer, size, filename, uploadFile)
  const errors = validateFile(metadata, validationOptions)

  return {
    metadata,
    buffer: Buffer.from(buffer),
    isValid: errors.length === 0,
    errors,
  }
}
