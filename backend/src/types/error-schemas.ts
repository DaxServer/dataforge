import z from 'zod'

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
export type ErrorCode = z.infer<typeof ErrorCodeSchema>

export const ApiErrors = z.array(
  z
    .object({
      code: ErrorCodeSchema,
      message: z.string(),
      details: z.array(z.any()),
    })
    .catchall(z.any()),
)
export type ApiErrors = z.infer<typeof ApiErrors>
