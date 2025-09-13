import { t } from 'elysia'

/**
 * Error codes used throughout the application
 */
export const ErrorCodeSchema = t.Union([
  t.Literal('VALIDATION'),
  t.Literal('MISSING_FILE_PATH'),
  t.Literal('MISSING_FILE'),
  t.Literal('INVALID_FILE_TYPE'),
  t.Literal('EMPTY_FILE'),
  t.Literal('FILE_NOT_FOUND'),
  t.Literal('TABLE_ALREADY_EXISTS'),
  t.Literal('INTERNAL_SERVER_ERROR'),
  t.Literal('DATABASE_ERROR'),
  t.Literal('PROJECT_CREATION_FAILED'),
  t.Literal('DATA_IMPORT_FAILED'),
  t.Literal('INVALID_JSON'),
  t.Literal('NOT_FOUND'),
])

/**
 * Single error object schema
 */
// const ErrorSchema = z.object({
//   code: ErrorCodeSchema,
//   message: z.string(),
//   details: z.array(z.any()),
// })

/**
 * Standard error response format for API errors
 */
// export const ErrorResponseSchema = z.object({
//   errors: z.array(ErrorSchema),
// })

/**
 * Error response with data array
 */
export const ApiError = t.Object({
  errors: t.Array(t.Any()),
})

/**
 * Type definitions derived from schemas
 */
export type ErrorCode = typeof ErrorCodeSchema.static
export type ApiError = typeof ApiError.static
