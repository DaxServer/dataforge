/**
 * Wikibase API error handling types and utilities
 */

// Error Categories
export enum WikibaseErrorCode {
  // Network Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMITED = 'RATE_LIMITED',

  // Authentication Errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',

  // Validation Errors
  INVALID_PROPERTY = 'INVALID_PROPERTY',
  INVALID_ITEM = 'INVALID_ITEM',
  INVALID_INSTANCE = 'INVALID_INSTANCE',
  MALFORMED_REQUEST = 'MALFORMED_REQUEST',

  // Cache Errors
  CACHE_UNAVAILABLE = 'CACHE_UNAVAILABLE',
  CACHE_CORRUPTION = 'CACHE_CORRUPTION',

  // Configuration Errors
  INVALID_CONFIG = 'INVALID_CONFIG',
  MISSING_CONFIG = 'MISSING_CONFIG',

  // Generic Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

// Main Error Interface
export interface WikibaseError extends Error {
  code: WikibaseErrorCode
  instanceId?: string
  propertyId?: string
  itemId?: string
  retryable: boolean
  fallbackData?: any
  originalError?: Error
  statusCode?: number
  details?: Record<string, any>
}

// Error Creation Utilities
export const createWikibaseError = (
  code: WikibaseErrorCode,
  message: string,
  options: Partial<WikibaseError> = {},
): WikibaseError => {
  const error = new Error(message) as WikibaseError
  error.code = code
  error.retryable = isRetryableError(code)

  // Copy additional properties
  Object.assign(error, options)

  return error
}

// Error Classification
export const isRetryableError = (code: WikibaseErrorCode): boolean => {
  const retryableCodes = [
    WikibaseErrorCode.NETWORK_ERROR,
    WikibaseErrorCode.TIMEOUT,
    WikibaseErrorCode.RATE_LIMITED,
    WikibaseErrorCode.SERVICE_UNAVAILABLE,
    WikibaseErrorCode.CACHE_UNAVAILABLE,
  ]

  return retryableCodes.includes(code)
}

export const isAuthenticationError = (code: WikibaseErrorCode): boolean => {
  const authCodes = [
    WikibaseErrorCode.UNAUTHORIZED,
    WikibaseErrorCode.FORBIDDEN,
    WikibaseErrorCode.INVALID_TOKEN,
  ]

  return authCodes.includes(code)
}

export const isValidationError = (code: WikibaseErrorCode): boolean => {
  const validationCodes = [
    WikibaseErrorCode.INVALID_PROPERTY,
    WikibaseErrorCode.INVALID_ITEM,
    WikibaseErrorCode.INVALID_INSTANCE,
    WikibaseErrorCode.MALFORMED_REQUEST,
  ]

  return validationCodes.includes(code)
}

// Error Response Types
export interface ErrorResponse {
  error: {
    code: WikibaseErrorCode
    message: string
    details?: Record<string, any>
    instanceId?: string
    timestamp: string
  }
  fallbackData?: any
}

// Retry Configuration
export interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
}

// Validation Result Types
export interface ValidationError {
  field: string
  message: string
  code: string
  value?: any
}

export interface ConfigValidationResult {
  isValid: boolean
  errors: ValidationError[]
}
