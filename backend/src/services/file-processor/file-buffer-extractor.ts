import { basename } from 'node:path'
import { readFromFilepath, readFromUrl } from '@backend/services/file-processor/file-reader'
import type { FileInput } from '@backend/services/file-processor/types'

export const extractFileBuffer = async (
  uploadFile: FileInput,
): Promise<{ buffer: ArrayBuffer; size: number; filename: string }> => {
  let buffer: ArrayBuffer
  let size: number
  let filename: string

  if (uploadFile.type === 'filepath') {
    if (!uploadFile.path) {
      throw new Error('File path is required for filepath type')
    }
    const result = await readFromFilepath(uploadFile.path)
    buffer = result.buffer
    size = result.size
    filename = basename(uploadFile.path)
  } else {
    if (!uploadFile.url) {
      throw new Error('URL is required for url type')
    }
    const result = await readFromUrl(uploadFile.url)
    buffer = result.buffer
    size = result.size
    filename = uploadFile.filename || 'unknown'
  }

  return { buffer, size, filename }
}
