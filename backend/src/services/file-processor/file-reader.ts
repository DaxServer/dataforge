export const readFromFilepath = async (
  path: string,
): Promise<{ buffer: ArrayBuffer; size: number }> => {
  const buffer = await Bun.file(path).arrayBuffer()
  return { buffer, size: buffer.byteLength }
}

export const readFromUrl = async (url: string): Promise<{ buffer: ArrayBuffer; size: number }> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download file from URL: ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return { buffer: arrayBuffer, size: arrayBuffer.byteLength }
}
