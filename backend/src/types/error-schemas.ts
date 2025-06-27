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
export const ErrorSchema = t.Object({
  code: ErrorCodeSchema,
  message: t.String(),
  details: t.Optional(t.Array(t.Any())),
})

/**
 * Standard error response format for API errors
 */
export const ErrorResponseSchema = t.Object({
  errors: t.Array(ErrorSchema),
})

/**
 * Error response with data array (for compatibility with existing schemas)
 */
export const ApiError = t.Object({
  data: t.Array(t.Any()),
  errors: t.Array(ErrorSchema),
})

/**
 * Type definitions derived from schemas
 */
export type ErrorCode = typeof ErrorCodeSchema.static
export type ApiError = typeof ApiError.static
