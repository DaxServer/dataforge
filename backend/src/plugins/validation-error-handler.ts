import { ApiErrorHandler } from '@backend/types/error-handler'

/**
 * Creates a validation error handler function that can be used with Elysia's onError
 * This function handles validation errors by returning a 422 status with formatted error details
 * and delegates other errors to ApiErrorHandler for consistent error responses
 */
export const createValidationErrorHandler = (code, error, set) => {
  // Handle validation errors
  if (code === 'VALIDATION') {
    set.status = 422
    return {
      data: [],
      errors: [
        {
          code,
          message: error.validator.Errors(error.value).First().schema.error,
          details: Array.from(error.validator.Errors(error.value)).map((e: any) => ({
            path: e.path,
            message: e.message,
            schema: e.schema,
          })),
        },
      ],
    }
  }

  // Handle other errors
  set.status = 500
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
  return ApiErrorHandler.internalServerErrorWithData(errorMessage)
}
