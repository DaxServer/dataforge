import type { FileMetadata } from '@backend/services/file-processor/types'
import sharp from 'sharp'

export const extractImageMetadata = async (
  buffer: Buffer,
  mimeType: string,
): Promise<{
  imageMetadata?: FileMetadata['imageMetadata']
}> => {
  if (!mimeType.startsWith('image/')) {
    return {}
  }

  try {
    const imageMetadata = await sharp(buffer).metadata()
    return { imageMetadata }
  } catch (error) {
    console.warn('Sharp failed to process image:', error)
    return {}
  }
}
