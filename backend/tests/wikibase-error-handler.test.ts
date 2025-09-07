import {
  WikibaseErrorCode,
  createWikibaseError,
  isAuthenticationError,
  isRetryableError,
  isValidationError,
} from '@backend/types/wikibase-errors'
import {
  WikibaseErrorHandler,
  handleWikibaseError,
  withRetry,
} from '@backend/utils/wikibase-error-handler'
import { describe, expect, test } from 'bun:test'

describe('Wikibase Error Types', () => {
  test('should create WikibaseError with correct properties', () => {
    const error = createWikibaseError(
      WikibaseErrorCode.INVALID_PROPERTY,
      'Property P123 not found',
      {
        instanceId: 'wikidata',
        propertyId: 'P123',
      },
    )

    expect(error.code).toBe(WikibaseErrorCode.INVALID_PROPERTY)
    expect(error.message).toBe('Property P123 not found')
    expect(error.instanceId).toBe('wikidata')
    expect(error.propertyId).toBe('P123')
    expect(error.retryable).toBe(false)
  })

  test('should correctly identify retryable errors', () => {
    expect(isRetryableError(WikibaseErrorCode.NETWORK_ERROR)).toBe(true)
    expect(isRetryableError(WikibaseErrorCode.RATE_LIMITED)).toBe(true)
    expect(isRetryableError(WikibaseErrorCode.INVALID_PROPERTY)).toBe(false)
    expect(isRetryableError(WikibaseErrorCode.UNAUTHORIZED)).toBe(false)
  })

  test('should correctly identify authentication errors', () => {
    expect(isAuthenticationError(WikibaseErrorCode.UNAUTHORIZED)).toBe(true)
    expect(isAuthenticationError(WikibaseErrorCode.FORBIDDEN)).toBe(true)
    expect(isAuthenticationError(WikibaseErrorCode.NETWORK_ERROR)).toBe(false)
  })

  test('should correctly identify validation errors', () => {
    expect(isValidationError(WikibaseErrorCode.INVALID_PROPERTY)).toBe(true)
    expect(isValidationError(WikibaseErrorCode.MALFORMED_REQUEST)).toBe(true)
    expect(isValidationError(WikibaseErrorCode.NETWORK_ERROR)).toBe(false)
  })
})

describe('WikibaseErrorHandler', () => {
  const errorHandler = new WikibaseErrorHandler()

  test('should handle network connection errors', () => {
    const networkError = new Error('Connection refused') as any
    networkError.code = 'ECONNREFUSED'

    const wikibaseError = errorHandler.handleApiError(networkError, {
      instanceId: 'wikidata',
      propertyId: 'P31',
    })

    expect(wikibaseError.code).toBe(WikibaseErrorCode.NETWORK_ERROR)
    expect(wikibaseError.instanceId).toBe('wikidata')
    expect(wikibaseError.propertyId).toBe('P31')
    expect(wikibaseError.retryable).toBe(true)
  })

  test('should handle HTTP 404 errors for properties', () => {
    const httpError = {
      response: { status: 404 },
      message: 'Not found',
    }

    const wikibaseError = errorHandler.handleApiError(httpError, {
      instanceId: 'wikidata',
      propertyId: 'P999999',
    })

    expect(wikibaseError.code).toBe(WikibaseErrorCode.INVALID_PROPERTY)
    expect(wikibaseError.message).toBe('Property P999999 not found')
    expect(wikibaseError.retryable).toBe(false)
  })

  test('should handle rate limiting errors', () => {
    const rateLimitError = {
      response: { status: 429 },
      message: 'Too many requests',
    }

    const wikibaseError = errorHandler.handleApiError(rateLimitError, {
      instanceId: 'wikidata',
    })

    expect(wikibaseError.code).toBe(WikibaseErrorCode.RATE_LIMITED)
    expect(wikibaseError.retryable).toBe(true)
  })

  test('should convert WikibaseError to ErrorResponse format', () => {
    const error = createWikibaseError(WikibaseErrorCode.INVALID_PROPERTY, 'Property not found', {
      instanceId: 'wikidata',
      propertyId: 'P123',
      fallbackData: { cached: true },
    })

    const response = errorHandler.toErrorResponse(error)

    expect(response.error.code).toBe(WikibaseErrorCode.INVALID_PROPERTY)
    expect(response.error.message).toBe('Property not found')
    expect(response.error.instanceId).toBe('wikidata')
    expect(response.fallbackData).toEqual({ cached: true })
    expect(response.error.timestamp).toBeDefined()
  })
})

describe('Error Handler Utilities', () => {
  test('handleWikibaseError should work as standalone function', () => {
    const error = new Error('Test error')
    const wikibaseError = handleWikibaseError(error, { instanceId: 'test' })

    expect(wikibaseError.code).toBe(WikibaseErrorCode.UNKNOWN_ERROR)
    expect(wikibaseError.instanceId).toBe('test')
  })

  test('withRetry should execute operation successfully on first try', async () => {
    let callCount = 0
    const operation = async () => {
      callCount++
      return 'success'
    }

    const result = await withRetry(operation, { instanceId: 'test' })

    expect(result).toBe('success')
    expect(callCount).toBe(1)
  })

  test('withRetry should not retry non-retryable errors', async () => {
    let callCount = 0
    const operation = async () => {
      callCount++
      const error = new Error('Invalid property') as any
      error.response = { status: 404 }
      throw error
    }

    try {
      await withRetry(operation, { instanceId: 'test', propertyId: 'P123' })
      expect(true).toBe(false) // Should not reach here
    } catch (error: any) {
      expect(error.code).toBe(WikibaseErrorCode.INVALID_PROPERTY)
      expect(callCount).toBe(1) // Should not retry
    }
  })
})
