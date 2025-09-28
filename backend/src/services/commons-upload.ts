// import type { CommonsAuthService } from '@backend/services/commons-auth'
import type { ProcessedFile } from '@backend/services/file-processor/types'
import type { CommonsUploadResponse, UploadValidationError } from '@backend/types/wikibase-upload'

export interface UploadOptions {
  filename?: string
  description: string
  categories?: string[]
  license?: string
  author?: string
  source?: string
  date?: string
  overwrite?: boolean
  ignoreWarnings?: boolean
}

export interface UploadProgress {
  uploadId: string
  filename: string
  bytesUploaded: number
  totalBytes: number
  percentage: number
  status: 'uploading' | 'processing' | 'completed' | 'failed'
  error?: string
}

export interface UploadResult {
  success: boolean
  filename?: string
  url?: string
  pageUrl?: string
  warnings?: Record<string, string>
  errors?: UploadValidationError[]
}

export interface ChunkedUploadSession {
  sessionKey: string
  offset: number
  totalSize: number
  filename: string
}

export class CommonsUploadService {
  private readonly chunkSize = 1024 * 1024 * 4 // 4MB chunks
  private readonly maxRetries = 3
  private readonly retryDelay = 1000 // 1 second

  constructor(private authService: any) {}

  private generateWikitext = (options: UploadOptions): string => {
    const parts: string[] = []

    // Description
    if (options.description) {
      parts.push(`== {{int:filedesc}} ==`)
      parts.push(options.description)
      parts.push('')
    }

    // Licensing
    parts.push(`== {{int:license-header}} ==`)
    if (options.license) {
      parts.push(`{{${options.license}}}`)
    } else {
      parts.push('{{subst:unc}}')
    }
    parts.push('')

    // Categories
    if (options.categories && options.categories.length > 0) {
      for (const category of options.categories) {
        parts.push(`[[Category:${category}]]`)
      }
    }

    return parts.join('\n')
  }

  private sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private retryOperation = async <T>(
    operation: () => Promise<T>,
    retries = this.maxRetries,
  ): Promise<T> => {
    let lastError: Error

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error

        if (attempt < retries) {
          await this.sleep(this.retryDelay * Math.pow(2, attempt))
        }
      }
    }

    throw lastError!
  }

  private initializeChunkedUpload = async (
    filename: string,
    fileSize: number,
  ): Promise<ChunkedUploadSession> => {
    const params = {
      action: 'upload',
      stash: '1',
      filesize: fileSize.toString(),
      filename,
      format: 'json',
    }

    const response = await this.authService.makeAuthenticatedRequest('POST', params)

    if (!response.ok) {
      throw new Error(`Failed to initialize chunked upload: ${response.statusText}`)
    }

    const data = (await response.json()) as { upload?: { sessionkey?: string } }

    if (!data.upload?.sessionkey) {
      throw new Error('Failed to get session key for chunked upload')
    }

    return {
      sessionKey: data.upload.sessionkey,
      offset: 0,
      totalSize: fileSize,
      filename,
    }
  }

  private uploadChunk = async (
    session: ChunkedUploadSession,
    chunk: Buffer,
    isLastChunk: boolean,
  ): Promise<void> => {
    const formData = new FormData()
    formData.append('action', 'upload')
    formData.append('stash', '1')
    formData.append('sessionkey', session.sessionKey)
    formData.append('offset', session.offset.toString())
    formData.append('format', 'json')

    if (isLastChunk) {
      formData.append('filename', session.filename)
    }

    const blob = new Blob([chunk])
    formData.append('chunk', blob, 'chunk')

    const params = {
      action: 'upload',
      stash: '1',
      sessionkey: session.sessionKey,
      offset: session.offset.toString(),
      format: 'json',
    }

    const response = await this.authService.makeAuthenticatedRequest('POST', params, formData)

    if (!response.ok) {
      throw new Error(`Failed to upload chunk: ${response.statusText}`)
    }

    const data = (await response.json()) as { upload?: { result?: string } }

    if (data.upload?.result !== 'Continue' && data.upload?.result !== 'Success') {
      throw new Error(`Chunk upload failed: ${data.upload?.result || 'Unknown error'}`)
    }

    session.offset += chunk.length
  }

  private finalizeUpload = async (
    session: ChunkedUploadSession,
    options: UploadOptions,
  ): Promise<CommonsUploadResponse> => {
    const wikitext = this.generateWikitext(options)

    const params: Record<string, string> = {
      action: 'upload',
      sessionkey: session.sessionKey,
      filename: options.filename || session.filename,
      text: wikitext,
      format: 'json',
    }

    if (options.overwrite) {
      params.ignorewarnings = '1'
    }

    const response = await this.authService.makeAuthenticatedRequest('POST', params)

    if (!response.ok) {
      throw new Error(`Failed to finalize upload: ${response.statusText}`)
    }

    return (await response.json()) as CommonsUploadResponse
  }

  uploadFile = async (
    processedFile: ProcessedFile,
    options: UploadOptions,
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<UploadResult> => {
    if (!processedFile.isValid) {
      return {
        success: false,
        errors: processedFile.errors,
      }
    }

    const uploadId = crypto.randomUUID()
    const filename = options.filename || processedFile.metadata.filename
    const fileBuffer = processedFile.buffer
    const totalBytes = fileBuffer.length

    try {
      return await this.uploadChunkedFile(processedFile, options, uploadId, onProgress)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      onProgress?.({
        uploadId,
        filename,
        bytesUploaded: 0,
        totalBytes,
        percentage: 0,
        status: 'failed',
        error: errorMessage,
      })

      return {
        success: false,
        errors: [
          {
            field: 'upload',
            code: 'UPLOAD_FAILED',
            message: errorMessage,
            details: { error: errorMessage },
          },
        ],
      }
    }
  }

  private uploadChunkedFile = async (
    processedFile: ProcessedFile,
    options: UploadOptions,
    uploadId: string,
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<UploadResult> => {
    const filename = options.filename || processedFile.metadata.filename
    const fileBuffer = processedFile.buffer
    const totalBytes = fileBuffer.length

    // Initialize chunked upload
    const session = await this.initializeChunkedUpload(filename, totalBytes)

    let bytesUploaded = 0

    // Upload chunks
    while (bytesUploaded < totalBytes) {
      const remainingBytes = totalBytes - bytesUploaded
      const chunkSize = Math.min(this.chunkSize, remainingBytes)
      const chunk = fileBuffer.subarray(bytesUploaded, bytesUploaded + chunkSize)
      const isLastChunk = bytesUploaded + chunkSize >= totalBytes

      await this.retryOperation(async () => {
        await this.uploadChunk(session, chunk, isLastChunk)
      })

      bytesUploaded += chunkSize

      onProgress?.({
        uploadId,
        filename,
        bytesUploaded,
        totalBytes,
        percentage: Math.round((bytesUploaded / totalBytes) * 100),
        status: 'uploading',
      })
    }

    // Finalize upload
    onProgress?.({
      uploadId,
      filename,
      bytesUploaded: totalBytes,
      totalBytes,
      percentage: 100,
      status: 'processing',
    })

    const result = await this.retryOperation(async () => {
      return await this.finalizeUpload(session, options)
    })

    if (result.upload.result === 'Success') {
      onProgress?.({
        uploadId,
        filename,
        bytesUploaded: totalBytes,
        totalBytes,
        percentage: 100,
        status: 'completed',
      })

      return {
        success: true,
        filename: result.upload.filename,
        url: result.upload.imageinfo?.url,
        pageUrl: result.upload.imageinfo?.descriptionurl,
        warnings: result.upload.warnings,
      }
    } else {
      return {
        success: false,
        errors: [
          {
            field: 'upload',
            code: 'UPLOAD_REJECTED',
            message: `Upload rejected: ${result.upload.result}`,
            details: { result: result.upload.result, warnings: result.upload.warnings },
          },
        ],
      }
    }
  }

  checkFileExists = async (filename: string): Promise<boolean> => {
    const params = {
      action: 'query',
      titles: `File:${filename}`,
      format: 'json',
    }

    const response = await this.authService.makeAuthenticatedRequest('GET', params)

    if (!response.ok) {
      return false
    }

    const data = (await response.json()) as {
      query?: {
        pages?: Record<string, { missing?: boolean }>
      }
    }

    if (!data.query?.pages) {
      return false
    }

    const pages = Object.values(data.query.pages)
    return pages.length > 0 && !pages[0]?.missing
  }
}
