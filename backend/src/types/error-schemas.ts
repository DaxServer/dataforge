import { t } from 'elysia'

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
export type ErrorCode = typeof ErrorCodeSchema.static

export const ApiErrors = t.Array(
  t.Object({
    code: ErrorCodeSchema,
    message: t.String(),
    details: t.Array(t.Any()),
  }),
)
export type ApiErrors = typeof ApiErrors.static
