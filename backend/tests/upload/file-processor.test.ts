import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { processMultipleFiles } from '@backend/services/file-processor/multiple-files-processor'
import { processFile } from '@backend/services/file-processor/processor'
import type { FileInput, FileValidationOptions } from '@backend/services/file-processor/types'
import sharp from 'sharp'

describe('file processor', () => {
  let tempDir: string
  let testFilePath: string

  beforeEach(async () => {
    tempDir = join(tmpdir(), 'dataforge-test-' + Date.now())
    await mkdir(tempDir, { recursive: true })
    testFilePath = join(tempDir, 'test-image.jpg')

    // Create a valid 1x1 pixel JPEG using sharp for testing
    const jpegBuffer = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .jpeg()
      .toBuffer()
    await Bun.write(testFilePath, jpegBuffer)
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  describe('processFile', () => {
    test('should process a valid JPEG file', () => {
      const fileInput: FileInput = {
        type: 'filepath',
        path: testFilePath,
      }

      expect(processFile(fileInput)).resolves.toMatchObject({
        metadata: {
          filename: 'test-image.jpg',
          mimeType: 'image/jpeg',
          extension: '.jpg',
        },
        isValid: true,
        errors: [],
      })
    })

    test('should handle filepath with basename extraction', () => {
      const fileInput: FileInput = {
        type: 'filepath',
        path: testFilePath,
        filename: 'custom-name.jpg', // This will be ignored for filepath type
      }

      expect(processFile(fileInput)).resolves.toMatchObject({
        metadata: {
          filename: 'test-image.jpg',
          mimeType: 'image/jpeg',
          extension: '.jpg',
        },
        isValid: true,
        errors: [],
      })
    })

    test('should validate file size limits', () => {
      const options: Partial<FileValidationOptions> = {
        maxFileSize: 10, // Very small limit
      }

      const fileInput: FileInput = {
        type: 'filepath',
        path: testFilePath,
      }

      expect(processFile(fileInput, options)).resolves.toMatchObject({
        metadata: {
          filename: 'test-image.jpg',
          mimeType: 'image/jpeg',
          extension: '.jpg',
        },
        isValid: false,
      })
    })

    test('should validate allowed MIME types', () => {
      const options: Partial<FileValidationOptions> = {
        allowedMimeTypes: ['image/png'], // Only PNG allowed
      }

      const fileInput: FileInput = {
        type: 'filepath',
        path: testFilePath,
      }

      expect(processFile(fileInput, options)).resolves.toMatchObject({
        metadata: {
          filename: 'test-image.jpg',
          mimeType: 'image/jpeg',
          extension: '.jpg',
        },
        isValid: false,
      })
    })

    test('should validate allowed extensions', () => {
      const options: Partial<FileValidationOptions> = {
        allowedExtensions: ['.png'], // Only PNG extension allowed
      }

      const fileInput: FileInput = {
        type: 'filepath',
        path: testFilePath,
      }

      expect(processFile(fileInput, options)).resolves.toMatchObject({
        metadata: {
          filename: 'test-image.jpg',
          mimeType: 'image/jpeg',
          extension: '.jpg',
        },
        isValid: false,
      })
    })

    test('should handle non-existent file', () => {
      const fileInput: FileInput = {
        type: 'filepath',
        path: '/non/existent/file.jpg',
      }

      // File not found should throw an error
      expect(processFile(fileInput)).rejects.toThrow('ENOENT: no such file or directory')
    })
  })

  describe('processMultipleFiles', () => {
    test('should process multiple valid files', async () => {
      const secondFilePath = join(tempDir, 'test-image-2.jpg')
      const jpegBuffer = await sharp({
        create: {
          width: 2,
          height: 2,
          channels: 3,
          background: { r: 0, g: 255, b: 0 },
        },
      })
        .jpeg()
        .toBuffer()
      await Bun.write(secondFilePath, jpegBuffer)

      const fileInputs: FileInput[] = [
        { type: 'filepath', path: testFilePath },
        { type: 'filepath', path: secondFilePath },
      ]

      expect(processMultipleFiles(fileInputs)).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            metadata: expect.objectContaining({
              filename: 'test-image.jpg',
              mimeType: 'image/jpeg',
              extension: '.jpg',
            }),
            isValid: true,
            errors: [],
          }),
          expect.objectContaining({
            metadata: expect.objectContaining({
              filename: 'test-image-2.jpg',
              mimeType: 'image/jpeg',
              extension: '.jpg',
            }),
            isValid: true,
            errors: [],
          }),
        ]),
      )
    })

    test('should handle mixed valid and invalid files', () => {
      const fileInputs: FileInput[] = [
        { type: 'filepath', path: testFilePath },
        { type: 'filepath', path: '/non/existent/file.jpg' },
      ]

      expect(processMultipleFiles(fileInputs)).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            metadata: expect.objectContaining({
              filename: 'test-image.jpg',
              mimeType: 'image/jpeg',
              extension: '.jpg',
            }),
            isValid: true,
            errors: [],
          }),
          expect.objectContaining({
            isValid: false,
            errors: expect.any(Array),
          }),
        ]),
      )
    })

    test('should apply validation options to all files', async () => {
      const secondFilePath = join(tempDir, 'test-image-2.jpg')
      const jpegBuffer = await sharp({
        create: {
          width: 3,
          height: 3,
          channels: 3,
          background: { r: 0, g: 0, b: 255 },
        },
      })
        .jpeg()
        .toBuffer()
      await Bun.write(secondFilePath, jpegBuffer)

      const fileInputs: FileInput[] = [
        { type: 'filepath', path: testFilePath },
        { type: 'filepath', path: secondFilePath },
      ]

      const options: Partial<FileValidationOptions> = {
        allowedMimeTypes: ['image/png'], // Only PNG allowed
      }

      expect(processMultipleFiles(fileInputs, options)).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            metadata: expect.objectContaining({
              filename: 'test-image.jpg',
              mimeType: 'image/jpeg',
              extension: '.jpg',
            }),
            isValid: false,
            errors: expect.any(Array),
          }),
          expect.objectContaining({
            metadata: expect.objectContaining({
              filename: 'test-image-2.jpg',
              mimeType: 'image/jpeg',
              extension: '.jpg',
            }),
            isValid: false,
            errors: expect.any(Array),
          }),
        ]),
      )
    })
  })

  describe('image metadata extraction', () => {
    test('should extract image dimensions and metadata for JPEG', () => {
      const fileInput: FileInput = {
        type: 'filepath',
        path: testFilePath,
      }

      expect(processFile(fileInput)).resolves.toMatchObject({
        metadata: {
          filename: 'test-image.jpg',
          mimeType: 'image/jpeg',
          extension: '.jpg',
          imageMetadata: expect.objectContaining({
            width: expect.any(Number),
            height: expect.any(Number),
            format: expect.any(String),
          }),
        },
        isValid: true,
        errors: [],
      })
    })
  })

  describe('image metadata extraction', () => {
    test('should extract image dimensions and metadata for JPEG', () => {
      const fileInput: FileInput = {
        type: 'filepath',
        path: testFilePath,
      }

      expect(processFile(fileInput)).resolves.toMatchObject({
        metadata: {
          filename: 'test-image.jpg',
          mimeType: 'image/jpeg',
          extension: '.jpg',
          imageMetadata: expect.objectContaining({
            width: expect.any(Number),
            height: expect.any(Number),
            format: expect.any(String),
          }),
        },
        isValid: true,
        errors: [],
      })
    })

    test('should handle non-image files gracefully', async () => {
      const textFilePath = join(tempDir, 'test.txt')
      await Bun.write(textFilePath, 'This is a text file')

      const fileInput: FileInput = {
        type: 'filepath',
        path: textFilePath,
      }

      const customOptions = {
        allowedMimeTypes: ['text/plain', 'application/octet-stream'],
        allowedExtensions: ['.txt'],
      }

      expect(processFile(fileInput, customOptions)).resolves.toMatchObject({
        metadata: {
          filename: 'test.txt',
          mimeType: 'application/octet-stream',
          extension: '.txt',
        },
        isValid: true,
        errors: [],
      })
    })
  })
})
