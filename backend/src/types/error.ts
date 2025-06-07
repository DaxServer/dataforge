/**
 * Represents a single error in the API response
 */
interface ApiError {
  /**
   * A machine-readable error code
   */
  code: string

  /**
   * A human-readable error message
   */
  message: string

  /**
   * Additional error details
   */
  details?: Record<string, unknown>

  /**
   * Stack trace (in development environment only)
   */
  stack?: string
}

/**
 * Standard error response format for API errors
 */
export interface ErrorResponse {
  /**
   * Array of error objects
   */
  errors: ApiError[]
}
