import { ItemSchema } from '@backend/api/project/project.wikibase'
import { UUIDPattern } from '@backend/api/project/schemas'
import { t } from 'elysia'

// Schema extension for Wikibase upload functionality
// Extends existing Wikibase schema without pollution
export const WikibaseUploadSchema = ItemSchema.extend({
  uploadColumn: t.Optional(t.String()),
  wikitext: t.Optional(t.String()),
})
export type WikibaseUploadSchema = typeof WikibaseUploadSchema.static

export const UploadJobStatus = t.Union([
  t.Literal('pending'),
  t.Literal('processing'),
  t.Literal('completed'),
  t.Literal('failed'),
  t.Literal('cancelled'),
])
export type UploadJobStatus = typeof UploadJobStatus.static

export const UploadFileStatus = t.Union([
  t.Literal('pending'),
  t.Literal('uploading'),
  t.Literal('uploaded'),
  t.Literal('failed'),
  t.Literal('skipped'),
])
export type UploadFileStatus = typeof UploadFileStatus.static

export const UploadJob = t.Object({
  id: UUIDPattern,
  projectId: t.String(),
  status: UploadJobStatus,
  totalFiles: t.Number({
    minimum: 0,
    type: 'integer',
  }),
  processedFiles: t.Number({
    minimum: 0,
    type: 'integer',
  }),
  successfulUploads: t.Number({
    minimum: 0,
    type: 'integer',
  }),
  failedUploads: t.Number({
    minimum: 0,
    type: 'integer',
  }),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  completedAt: t.Optional(t.Date()),
  errorMessage: t.Optional(t.String()),
})
export type UploadJob = typeof UploadJob.static

export const UploadFile = t.Object({
  id: UUIDPattern,
  jobId: UUIDPattern,
  fileName: t.String(),
  filePath: t.Optional(t.String()),
  fileUrl: t.Optional(t.String()),
  fileSize: t.Optional(
    t.Number({
      minimum: 0,
      type: 'integer',
    }),
  ),
  mimeType: t.Optional(t.String()),
  status: UploadFileStatus,
  commonsFileName: t.Optional(t.String()),
  commonsUrl: t.Optional(t.String()),
  wikitext: t.Optional(t.String()),
  errorMessage: t.Optional(t.String()),
  uploadedAt: t.Optional(t.Date()),
})
export type UploadFile = typeof UploadFile.static

export const CommonsUploadResponse = t.Object({
  upload: t.Object({
    result: t.String(),
    filename: t.Optional(t.String()),
    imageinfo: t.Optional(
      t.Object({
        url: t.String({
          format: 'uri',
        }),
        descriptionurl: t.String({
          format: 'uri',
        }),
      }),
    ),
    warnings: t.Optional(t.Record(t.String(), t.String())),
  }),
})
export type CommonsUploadResponse = typeof CommonsUploadResponse.static

export const UploadValidationError = t.Object({
  field: t.String(),
  message: t.String(),
  code: t.String(),
  details: t.Optional(t.Record(t.String(), t.Unknown())),
})
export type UploadValidationError = typeof UploadValidationError.static

export const UploadConfiguration = t.Object({
  maxFileSize: t.Number({
    minimum: 1,
    type: 'integer',
  }),
  allowedMimeTypes: t.Array(t.String()),
  chunkSize: t.Number({
    minimum: 1024,
    type: 'integer',
  }),
  maxConcurrentUploads: t.Number({
    minimum: 1,
    type: 'integer',
  }),
  retryAttempts: t.Number({
    minimum: 0,
    type: 'integer',
  }),
})
export type UploadConfiguration = typeof UploadConfiguration.static
