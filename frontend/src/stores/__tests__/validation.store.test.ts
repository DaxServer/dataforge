import { describe, it, expect, beforeEach } from 'bun:test'
import { createPinia, setActivePinia } from 'pinia'
import { useValidationStore } from '@frontend/stores/validation.store'
import type { ValidationError } from '@frontend/types/wikibase-schema'

describe('useValidationStore', () => {
  let store: ReturnType<typeof useValidationStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useValidationStore()
  })

  describe('addError and addWarning', () => {
    it('should add errors to the error list', () => {
      const error: ValidationError = {
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Required mapping is missing',
        path: 'item.terms.labels.en',
      }

      store.addError(error)

      expect(store.errors).toHaveLength(1)
      expect(store.errors[0]).toEqual(error)
    })

    it('should add warnings to the warning list', () => {
      const warning: ValidationError = {
        type: 'warning',
        code: 'INCOMPATIBLE_DATA_TYPE',
        message: 'Column data type is incompatible with target',
        path: 'item.statements[0].value',
      }

      store.addWarning(warning)

      expect(store.warnings).toHaveLength(1)
      expect(store.warnings[0]).toEqual(warning)
    })

    it('should not add duplicate errors', () => {
      const error: ValidationError = {
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Required mapping is missing',
        path: 'item.terms.labels.en',
      }

      store.addError(error)
      store.addError(error)

      expect(store.errors).toHaveLength(1)
    })

    it('should not add duplicate warnings', () => {
      const warning: ValidationError = {
        type: 'warning',
        code: 'INCOMPATIBLE_DATA_TYPE',
        message: 'Column data type is incompatible with target',
        path: 'item.statements[0].value',
      }

      store.addWarning(warning)
      store.addWarning(warning)

      expect(store.warnings).toHaveLength(1)
    })
  })

  describe('clearError', () => {
    it('should clear a specific error by exact match', () => {
      const error1: ValidationError = {
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Required mapping is missing',
        path: 'item.terms.labels.en',
      }
      const error2: ValidationError = {
        type: 'error',
        code: 'INCOMPATIBLE_DATA_TYPE',
        message: 'Different error type',
        path: 'item.terms.labels.en',
      }
      const error3: ValidationError = {
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Required mapping is missing',
        path: 'item.terms.labels.fr',
      }

      store.addError(error1)
      store.addError(error2)
      store.addError(error3)

      store.clearError(error1)

      expect(store.errors).toHaveLength(2)
      expect(
        store.errors.find(
          (e) => e.code === 'MISSING_REQUIRED_MAPPING' && e.path === 'item.terms.labels.en',
        ),
      ).toBeUndefined()
      expect(store.errors.find((e) => e.code === 'INCOMPATIBLE_DATA_TYPE')).toBeDefined()
      expect(store.errors.find((e) => e.path === 'item.terms.labels.fr')).toBeDefined()
    })

    it('should clear a specific warning by exact match', () => {
      const warning1: ValidationError = {
        type: 'warning',
        code: 'INCOMPATIBLE_DATA_TYPE',
        message: 'Column data type is incompatible with target',
        path: 'item.terms.labels.en',
      }
      const warning2: ValidationError = {
        type: 'warning',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Different warning type',
        path: 'item.terms.labels.en',
      }

      store.addWarning(warning1)
      store.addWarning(warning2)

      store.clearError(warning1)

      expect(store.warnings).toHaveLength(1)
      expect(store.warnings[0]?.code).toBe('MISSING_REQUIRED_MAPPING')
    })

    it('should not clear errors that do not match exactly', () => {
      const error1: ValidationError = {
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Required mapping is missing',
        path: 'item.terms.labels.en',
      }
      const error2: ValidationError = {
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Required mapping is missing',
        path: 'item.terms.labels.fr',
      }

      store.addError(error1)
      store.addError(error2)

      // Try to clear an error that doesn't exist
      const nonExistentError: ValidationError = {
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Different message',
        path: 'item.terms.labels.en',
      }

      store.clearError(nonExistentError)

      expect(store.errors).toHaveLength(2)
    })

    it('should handle clearing error when no errors exist', () => {
      const error: ValidationError = {
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Required mapping is missing',
        path: 'item.terms.labels.en',
      }

      store.clearError(error)

      expect(store.errors).toHaveLength(0)
      expect(store.warnings).toHaveLength(0)
    })
  })

  describe('clearErrorsForPath', () => {
    it('should clear errors for a specific path using startsWith (default behavior)', () => {
      const error1: ValidationError = {
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Required mapping is missing',
        path: 'item.terms.labels.en',
      }
      const error2: ValidationError = {
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Required mapping is missing',
        path: 'item.terms.labels.fr',
      }
      const error3: ValidationError = {
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Required mapping is missing',
        path: 'item.statements[0].value',
      }

      store.addError(error1)
      store.addError(error2)
      store.addError(error3)

      store.clearErrorsForPath('item.terms.labels')

      expect(store.errors).toHaveLength(1)
      expect(store.errors[0]?.path).toBe('item.statements[0].value')
    })

    it('should clear errors for exact path match when exactMatch is true', () => {
      const error1: ValidationError = {
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Required mapping is missing',
        path: 'item.terms.labels',
      }
      const error2: ValidationError = {
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Required mapping is missing',
        path: 'item.terms.labels.en',
      }
      const error3: ValidationError = {
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Required mapping is missing',
        path: 'item.terms.labels.fr',
      }

      store.addError(error1)
      store.addError(error2)
      store.addError(error3)

      store.clearErrorsForPath('item.terms.labels', true)

      expect(store.errors).toHaveLength(2)
      expect(store.errors.find((e) => e.path === 'item.terms.labels')).toBeUndefined()
      expect(store.errors.find((e) => e.path === 'item.terms.labels.en')).toBeDefined()
      expect(store.errors.find((e) => e.path === 'item.terms.labels.fr')).toBeDefined()
    })

    it('should clear warnings for a specific path', () => {
      const warning1: ValidationError = {
        type: 'warning',
        code: 'INCOMPATIBLE_DATA_TYPE',
        message: 'Column data type is incompatible with target',
        path: 'item.terms.labels.en',
      }
      const warning2: ValidationError = {
        type: 'warning',
        code: 'INCOMPATIBLE_DATA_TYPE',
        message: 'Column data type is incompatible with target',
        path: 'item.statements[0].value',
      }

      store.addWarning(warning1)
      store.addWarning(warning2)

      store.clearErrorsForPath('item.terms.labels')

      expect(store.warnings).toHaveLength(1)
      expect(store.warnings[0]?.path).toBe('item.statements[0].value')
    })

    it('should clear warnings for exact path match when exactMatch is true', () => {
      const warning1: ValidationError = {
        type: 'warning',
        code: 'INCOMPATIBLE_DATA_TYPE',
        message: 'Column data type is incompatible with target',
        path: 'item.terms.labels',
      }
      const warning2: ValidationError = {
        type: 'warning',
        code: 'INCOMPATIBLE_DATA_TYPE',
        message: 'Column data type is incompatible with target',
        path: 'item.terms.labels.en',
      }

      store.addWarning(warning1)
      store.addWarning(warning2)

      store.clearErrorsForPath('item.terms.labels', true)

      expect(store.warnings).toHaveLength(1)
      expect(store.warnings[0]?.path).toBe('item.terms.labels.en')
    })
  })

  describe('clearErrorsByCode', () => {
    it('should clear errors with a specific code', () => {
      const error1: ValidationError = {
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Required mapping is missing',
        path: 'item.terms.labels.en',
      }
      const error2: ValidationError = {
        type: 'error',
        code: 'INCOMPATIBLE_DATA_TYPE',
        message: 'Column data type is incompatible with target',
        path: 'item.statements[0].value',
      }

      store.addError(error1)
      store.addError(error2)

      store.clearErrorsByCode('MISSING_REQUIRED_MAPPING')

      expect(store.errors).toHaveLength(1)
      expect(store.errors[0]?.code).toBe('INCOMPATIBLE_DATA_TYPE')
    })

    it('should clear warnings with a specific code', () => {
      const warning1: ValidationError = {
        type: 'warning',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Required mapping is missing',
        path: 'item.terms.labels.en',
      }
      const warning2: ValidationError = {
        type: 'warning',
        code: 'INCOMPATIBLE_DATA_TYPE',
        message: 'Column data type is incompatible with target',
        path: 'item.statements[0].value',
      }

      store.addWarning(warning1)
      store.addWarning(warning2)

      store.clearErrorsByCode('MISSING_REQUIRED_MAPPING')

      expect(store.warnings).toHaveLength(1)
      expect(store.warnings[0]?.code).toBe('INCOMPATIBLE_DATA_TYPE')
    })
  })

  describe('clearAll', () => {
    it('should clear all errors and warnings', () => {
      const error: ValidationError = {
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Required mapping is missing',
        path: 'item.terms.labels.en',
      }
      const warning: ValidationError = {
        type: 'warning',
        code: 'INCOMPATIBLE_DATA_TYPE',
        message: 'Column data type is incompatible with target',
        path: 'item.statements[0].value',
      }

      store.addError(error)
      store.addWarning(warning)
      store.$reset()

      expect(store.errors).toHaveLength(0)
      expect(store.warnings).toHaveLength(0)
    })
  })

  describe('getErrorsForPath', () => {
    it('should return errors for a specific path', () => {
      const error1: ValidationError = {
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Required mapping is missing',
        path: 'item.terms.labels.en',
      }
      const error2: ValidationError = {
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Required mapping is missing',
        path: 'item.terms.labels.fr',
      }
      const error3: ValidationError = {
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Required mapping is missing',
        path: 'item.statements[0].value',
      }

      store.addError(error1)
      store.addError(error2)
      store.addError(error3)

      const labelsErrors = store.getErrorsForPath('item.terms.labels')

      expect(labelsErrors).toHaveLength(2)
      expect(labelsErrors.every((e) => e.path.startsWith('item.terms.labels'))).toBeTrue()
    })
  })

  describe('getWarningsForPath', () => {
    it('should return warnings for a specific path', () => {
      const warning1: ValidationError = {
        type: 'warning',
        code: 'INCOMPATIBLE_DATA_TYPE',
        message: 'Column data type is incompatible with target',
        path: 'item.terms.labels.en',
      }
      const warning2: ValidationError = {
        type: 'warning',
        code: 'INCOMPATIBLE_DATA_TYPE',
        message: 'Column data type is incompatible with target',
        path: 'item.terms.labels.fr',
      }
      const warning3: ValidationError = {
        type: 'warning',
        code: 'INCOMPATIBLE_DATA_TYPE',
        message: 'Column data type is incompatible with target',
        path: 'item.statements[0].value',
      }

      store.addWarning(warning1)
      store.addWarning(warning2)
      store.addWarning(warning3)

      const labelsWarnings = store.getWarningsForPath('item.terms.labels')

      expect(labelsWarnings).toHaveLength(2)
      expect(labelsWarnings.every((w) => w.path.startsWith('item.terms.labels'))).toBeTrue()
    })
  })

  describe('hasErrorsForPath and hasWarningsForPath', () => {
    it('should return true if there are errors for a path', () => {
      const error: ValidationError = {
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Required mapping is missing',
        path: 'item.terms.labels.en',
      }

      store.addError(error)

      expect(store.hasErrorsForPath('item.terms.labels')).toBeTrue()
      expect(store.hasErrorsForPath('item.statements')).toBeFalse()
    })

    it('should return true if there are warnings for a path', () => {
      const warning: ValidationError = {
        type: 'warning',
        code: 'INCOMPATIBLE_DATA_TYPE',
        message: 'Column data type is incompatible with target',
        path: 'item.terms.labels.en',
      }

      store.addWarning(warning)

      expect(store.hasWarningsForPath('item.terms.labels')).toBeTrue()
      expect(store.hasWarningsForPath('item.statements')).toBeFalse()
    })
  })

  describe('getValidationResult', () => {
    it('should return validation result with isValid false when there are errors', () => {
      const error: ValidationError = {
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Required mapping is missing',
        path: 'item.terms.labels.en',
      }

      store.addError(error)

      const result = store.getValidationResult()

      expect(result).toEqual({
        isValid: false,
        errors: [error],
        warnings: [],
      })
    })

    it('should return validation result with isValid true when there are no errors', () => {
      const warning: ValidationError = {
        type: 'warning',
        code: 'INCOMPATIBLE_DATA_TYPE',
        message: 'Column data type is incompatible with target',
        path: 'item.statements[0].value',
      }

      store.addWarning(warning)

      const result = store.getValidationResult()

      expect(result).toEqual({
        isValid: true,
        errors: [],
        warnings: [warning],
      })
    })
  })

  describe('computed properties', () => {
    it('should update hasErrors computed property', () => {
      expect(store.hasErrors).toBeFalse()

      const error: ValidationError = {
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Required mapping is missing',
        path: 'item.terms.labels.en',
      }
      store.addError(error)

      expect(store.hasErrors).toBeTrue()
    })

    it('should update hasWarnings computed property', () => {
      expect(store.hasWarnings).toBeFalse()

      const warning: ValidationError = {
        type: 'warning',
        code: 'INCOMPATIBLE_DATA_TYPE',
        message: 'Column data type is incompatible with target',
        path: 'item.statements[0].value',
      }
      store.addWarning(warning)

      expect(store.hasWarnings).toBeTrue()
    })

    it('should update error and warning counts', () => {
      expect(store.errorCount).toBe(0)
      expect(store.warningCount).toBe(0)
      expect(store.totalIssueCount).toBe(0)

      const error: ValidationError = {
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Required mapping is missing',
        path: 'item.terms.labels.en',
      }
      const warning: ValidationError = {
        type: 'warning',
        code: 'INCOMPATIBLE_DATA_TYPE',
        message: 'Column data type is incompatible with target',
        path: 'item.statements[0].value',
      }

      store.addError(error)
      store.addWarning(warning)

      expect(store.errorCount).toBe(1)
      expect(store.warningCount).toBe(1)
      expect(store.totalIssueCount).toBe(2)
    })

    it('should update hasAnyIssues computed property', () => {
      expect(store.hasAnyIssues).toBe(false)

      const warning: ValidationError = {
        type: 'warning',
        code: 'INCOMPATIBLE_DATA_TYPE',
        message: 'Column data type is incompatible with target',
        path: 'item.statements[0].value',
      }
      store.addWarning(warning)

      expect(store.hasAnyIssues).toBeTrue()
    })
  })
})
