/**
 * Wikibase API error handling utilities
 */

import type { ErrorResponse, RetryConfig, WikibaseError } from '@backend/types/wikibase-errors'
import {
  createWikibaseError,
  DEFAULT_RETRY_CONFIG,
  WikibaseErrorCode,
} from '@backend/types/wikibase-errors'

// Error Handler Class
export class WikibaseErrorHandler {
  private retryConfig: RetryConfig

  constructor(retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG) {
    this.retryConfig = retryConfig
  }

  /**
   * Handle API errors and convert them to WikibaseError format
   */
  handleApiError = (
    error: any,
    context: {
      instanceId?: string
      propertyId?: string
      itemId?: string
      operation?: string
    } = {},
  ): WikibaseError => {
    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return createWikibaseError(
        WikibaseErrorCode.NETWORK_ERROR,
        `Network connection failed: ${error.message}`,
        {
          ...context,
          originalError: error,
          retryable: true,
        },
      )
    }

    // Handle timeout errors
    if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      return createWikibaseError(WikibaseErrorCode.TIMEOUT, `Request timed out: ${error.message}`, {
        ...context,
        originalError: error,
        retryable: true,
      })
    }

    // Handle HTTP status codes
    if (error.response?.status) {
      const statusCode = error.response.status

      switch (statusCode) {
        case 401:
          return createWikibaseError(
            WikibaseErrorCode.UNAUTHORIZED,
            'Authentication required or invalid credentials',
            {
              ...context,
              statusCode,
              originalError: error,
              retryable: false,
            },
          )

        case 403:
          return createWikibaseError(
            WikibaseErrorCode.FORBIDDEN,
            'Access forbidden - insufficient permissions',
            {
              ...context,
              statusCode,
              originalError: error,
              retryable: false,
            },
          )

        case 404:
          if (context.propertyId) {
            return createWikibaseError(
              WikibaseErrorCode.INVALID_PROPERTY,
              `Property ${context.propertyId} not found`,
              {
                ...context,
                statusCode,
                originalError: error,
                retryable: false,
              },
            )
          }

          if (context.itemId) {
            return createWikibaseError(
              WikibaseErrorCode.INVALID_ITEM,
              `Item ${context.itemId} not found`,
              {
                ...context,
                statusCode,
                originalError: error,
                retryable: false,
              },
            )
          }

          return createWikibaseError(WikibaseErrorCode.UNKNOWN_ERROR, 'Resource not found', {
            ...context,
            statusCode,
            originalError: error,
            retryable: false,
          })

        case 429:
          return createWikibaseError(
            WikibaseErrorCode.RATE_LIMITED,
            'Rate limit exceeded - too many requests',
            {
              ...context,
              statusCode,
              originalError: error,
              retryable: true,
            },
          )

        case 500:
        case 502:
        case 503:
        case 504:
          return createWikibaseError(
            WikibaseErrorCode.SERVICE_UNAVAILABLE,
            `Service temporarily unavailable (${statusCode})`,
            {
              ...context,
              statusCode,
              originalError: error,
              retryable: true,
            },
          )

        default:
          return createWikibaseError(
            WikibaseErrorCode.UNKNOWN_ERROR,
            `HTTP ${statusCode}: ${error.message}`,
            {
              ...context,
              statusCode,
              originalError: error,
              retryable: statusCode >= 500,
            },
          )
      }
    }

    // Handle instance validation errors
    if (error.message?.includes('No client found for instance')) {
      return createWikibaseError(WikibaseErrorCode.INVALID_INSTANCE, error.message, {
        ...context,
        originalError: error,
        retryable: false,
      })
    }

    // Handle validation errors
    if (error.message?.includes('invalid') || error.message?.includes('malformed')) {
      return createWikibaseError(
        WikibaseErrorCode.MALFORMED_REQUEST,
        `Invalid request: ${error.message}`,
        {
          ...context,
          originalError: error,
          retryable: false,
        },
      )
    }

    // Default unknown error
    return createWikibaseError(
      WikibaseErrorCode.UNKNOWN_ERROR,
      error.message || 'An unknown error occurred',
      {
        ...context,
        originalError: error,
        retryable: false,
      },
    )
  }

  /**
   * Execute operation with retry logic
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    context: {
      instanceId?: string
      propertyId?: string
      itemId?: string
      operationName?: string
    } = {},
  ): Promise<T> {
    let lastError: WikibaseError | null = null

    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        const wikibaseError = this.handleApiError(error, context)
        lastError = wikibaseError

        // Don't retry if error is not retryable or this is the last attempt
        if (!wikibaseError.retryable || attempt === this.retryConfig.maxAttempts) {
          throw wikibaseError
        }

        // Calculate delay for next attempt
        const delay = Math.min(
          this.retryConfig.baseDelay * this.retryConfig.backoffMultiplier ** (attempt - 1),
          this.retryConfig.maxDelay,
        )

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }

  /**
   * Convert WikibaseError to API response format
   */
  toErrorResponse = (error: WikibaseError): ErrorResponse => {
    return {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        instanceId: error.instanceId,
        timestamp: new Date().toISOString(),
      },
      fallbackData: error.fallbackData,
    }
  }
}

// Default error handler instance
export const defaultErrorHandler = new WikibaseErrorHandler()

// Utility functions
export const handleWikibaseError = defaultErrorHandler.handleApiError
export const withRetry = defaultErrorHandler.withRetry.bind(defaultErrorHandler)
export const toErrorResponse = defaultErrorHandler.toErrorResponse
