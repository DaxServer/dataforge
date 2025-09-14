import z from 'zod'

/**
 * Error codes used throughout the application
 */
export const ErrorCodeSchema = z.union([
  z.literal('VALIDATION'),
  z.literal('MISSING_FILE_PATH'),
  z.literal('MISSING_FILE'),
  z.literal('INVALID_FILE_TYPE'),
  z.literal('EMPTY_FILE'),
  z.literal('FILE_NOT_FOUND'),
  z.literal('TABLE_ALREADY_EXISTS'),
  z.literal('INTERNAL_SERVER_ERROR'),
  z.literal('DATABASE_ERROR'),
  z.literal('PROJECT_CREATION_FAILED'),
  z.literal('DATA_IMPORT_FAILED'),
  z.literal('INVALID_JSON'),
  z.literal('NOT_FOUND'),
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
export const ApiError = z.array(z.any())

/**
 * Type definitions derived from schemas
 */
export type ErrorCode = z.infer<typeof ErrorCodeSchema>
export type ApiError = z.infer<typeof ApiError>
