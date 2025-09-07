import { ApiErrorHandler } from '@backend/types/error-handler'
import { Elysia } from 'elysia'

/**
 * Error handler plugin for Elysia
 * Handles validation errors and other application errors with consistent formatting
 * This plugin has scoped scope and will be applied to all instances that use the plugin
 */
export const errorHandlerPlugin = new Elysia({
  name: 'error-handler',
  seed: 'scoped-error-handler',
})
  .onError(({ code, error, set }) => {
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
  })
  .as('scoped')
