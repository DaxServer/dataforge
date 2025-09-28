import { fileTypeFromBuffer } from 'file-type'

const mimeMap: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogv': 'video/ogg',
  '.mp3': 'audio/mp3',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.pdf': 'application/pdf',
}

export const detectMimeType = async (buffer: Buffer, extension: string): Promise<string> => {
  const detectedType = await fileTypeFromBuffer(buffer)
  if (detectedType) {
    return detectedType.mime
  }

  return mimeMap[extension.toLowerCase()] || 'application/octet-stream'
}
