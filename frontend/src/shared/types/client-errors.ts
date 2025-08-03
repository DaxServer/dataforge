import type { ErrorCode as BackendErrorCode } from '@backend/types/error-schemas'

/**
 * Frontend-specific error codes for client-side failures
 */
export type FrontendErrorCode =
  | 'SCHEMA_EDITOR_INIT_FAILED'
  | 'COMPONENT_MOUNT_FAILED'
  | 'CLIENT_VALIDATION_FAILED'
  | 'UI_STATE_ERROR'
  | 'DRAG_DROP_INIT_FAILED'
  | 'STORE_INIT_FAILED'

/**
 * Combined error codes including both backend and frontend
 */
export type ExtendedErrorCode = BackendErrorCode | FrontendErrorCode

/**
 * Extended error object that can handle both backend and frontend errors
 */
export interface ExtendedError {
  errors: {
    code: ExtendedErrorCode
    message: string
    details?: any[]
  }[]
  data: any[]
}

/**
 * Helper function to create frontend-specific errors
 */
export const createFrontendError = (
  code: FrontendErrorCode,
  _message: string,
  details?: any[],
): ExtendedError => ({
  errors: [{ code, message: _message, details }],
  data: [],
})
