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
  .onError(({ code, error, status }) => {
    // Handle validation errors
    if (code === 'VALIDATION') {
      return status(422, [error.valueError])
    }

    // Handle other errors
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    return status(500, ApiErrorHandler.internalServerErrorWithData(errorMessage))
  })
  .as('scoped')
