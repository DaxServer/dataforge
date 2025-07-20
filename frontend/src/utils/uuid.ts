/**
 * UUID utility that works in both browser and Bun environments
 */

/**
 * Generates a UUID v4 string
 * Uses crypto.randomUUID() if available (modern browsers and Bun),
 * otherwise falls back to a polyfill implementation
 */
const generateUUID = (): string => {
  // Check if Bun.randomUUIDv7 is available (Bun runtime)
  if (typeof Bun !== 'undefined' && Bun.randomUUIDv7) {
    return Bun.randomUUIDv7()
  }

  // Check if crypto.randomUUID is available (modern browsers and Bun)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // Fallback polyfill for environments without native UUID support
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Generates a UUID v7 string (time-ordered)
 * Uses Bun.randomUUIDv7() if available, otherwise falls back to UUID v4
 */
export const generateUUIDv7 = (): string => {
  // Check if Bun.randomUUIDv7 is available (Bun runtime)
  if (typeof Bun !== 'undefined' && Bun.randomUUIDv7) {
    return Bun.randomUUIDv7()
  }

  // Fallback to regular UUID v4 if v7 is not available
  return generateUUID()
}
