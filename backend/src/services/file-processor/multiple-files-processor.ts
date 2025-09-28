import { processFile } from '@backend/services/file-processor/processor'
import type {
  FileInput,
  FileValidationOptions,
  ProcessedFile,
} from '@backend/services/file-processor/types'
import { basename } from 'node:path'

export const processMultipleFiles = async (
  uploadFiles: FileInput[],
  options: Partial<FileValidationOptions> = {},
): Promise<ProcessedFile[]> => {
  const results = await Promise.allSettled(uploadFiles.map((file) => processFile(file, options)))

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      return {
        metadata: {
          filename:
            uploadFiles[index]?.type === 'filepath'
              ? basename(uploadFiles[index].path!)
              : uploadFiles[index]?.filename || 'unknown',
          size: 0,
          mimeType: '',
          extension: '',
          hash: '',
        },
        buffer: Buffer.alloc(0),
        isValid: false,
        errors: [
          {
            field: 'file',
            code: 'PROCESSING_FAILED',
            message: `Failed to process file: ${result.reason}`,
            details: { error: result.reason },
          },
        ],
      }
    }
  })
}
