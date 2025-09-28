const hasher = new Bun.CryptoHasher('sha256')

export const calculateFileHash = (buffer: Buffer): string => {
  return hasher.update(buffer).digest('hex')
}
