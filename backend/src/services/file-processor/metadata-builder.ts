import { calculateFileHash } from '@backend/services/file-processor/hash-calculator'
import { extractImageMetadata } from '@backend/services/file-processor/image-extractor'
import { detectMimeType } from '@backend/services/file-processor/mime-detector'
import type { FileInput, FileMetadata } from '@backend/services/file-processor/types'
import { extname } from 'node:path'

export const buildFileMetadata = async (
  buffer: ArrayBuffer,
  size: number,
  filename: string,
  uploadFile: FileInput,
): Promise<FileMetadata> => {
  const extension = extname(filename)
  const mimeType =
    uploadFile.type === 'url' && uploadFile.mimeType
      ? uploadFile.mimeType
      : await detectMimeType(Buffer.from(buffer), extension)

  const hash = calculateFileHash(Buffer.from(buffer))
  const imageData = await extractImageMetadata(Buffer.from(buffer), mimeType)

  return {
    filename,
    size,
    mimeType,
    extension,
    hash,
    imageMetadata: imageData.imageMetadata,
  }
}
