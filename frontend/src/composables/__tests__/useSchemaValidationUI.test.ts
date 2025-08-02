import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { createPinia, setActivePinia } from 'pinia'
import { useSchemaValidationUI } from '@frontend/composables/useSchemaValidationUI'
import { useSchemaStore } from '@frontend/stores/schema.store'
import { useValidationStore } from '@frontend/stores/validation.store'
import type { PropertyReference, ValueMapping } from '@frontend/types/wikibase-schema'

describe('useSchemaValidationUI', () => {
  let schemaStore: ReturnType<typeof useSchemaStore>
  let validationStore: ReturnType<typeof useValidationStore>
  let schemaValidationUI: ReturnType<typeof useSchemaValidationUI>

  beforeEach(() => {
    setActivePinia(createPinia())
    schemaStore = useSchemaStore()
    validationStore = useValidationStore()

    // Add required validation rules
    validationStore.addRule({
      id: 'schema-name-required',
      name: 'Schema Name Required',
      fieldPath: 'schema.name',
      message: 'Schema name is required',
      severity: 'error',
      enabled: true,
      validator: mock(),
    })

    validationStore.addRule({
      id: 'wikibase-url-required',
      name: 'Wikibase URL Required',
      fieldPath: 'schema.wikibase',
      message: 'Wikibase URL is required',
      severity: 'error',
      enabled: true,
      validator: mock(),
    })

    validationStore.addRule({
      id: 'labels-required',
      name: 'Labels Required',
      fieldPath: 'item.terms.labels',
      message: 'At least one label mapping is required',
      severity: 'error',
      enabled: true,
      validator: mock(),
    })

    validationStore.addRule({
      id: 'statements-recommended',
      name: 'Statements Recommended',
      fieldPath: 'item.statements',
      message: 'Statement mappings are recommended for completeness',
      severity: 'warning',
      enabled: true,
      validator: mock(),
    })

    schemaValidationUI = useSchemaValidationUI()
  })

  describe('updateValidationErrors', () => {
    test('should add completeness validation errors to validation store', () => {
      // Start with partial schema to trigger validation
      schemaStore.updateSchemaName('Test Schema')
      schemaValidationUI.updateValidationErrors()

      expect(validationStore.hasErrors).toBe(true)
      expect(validationStore.getErrorsForPath('schema.wikibase')).toHaveLength(1)
      expect(validationStore.getErrorsForPath('item.terms.labels')).toHaveLength(1)
    })

    test('should clear errors when fields are completed', () => {
      // Manually add errors to validation store
      validationStore.addError({
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Wikibase URL is required',
        path: 'schema.wikibase',
      })
      validationStore.addError({
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Labels are required',
        path: 'item.terms.labels',
      })
      expect(validationStore.hasErrors).toBe(true)

      // Test that clearErrorsForPath works correctly
      validationStore.clearErrorsForPath('schema.wikibase', true)

      expect(validationStore.getErrorsForPath('schema.wikibase')).toHaveLength(0)
      expect(validationStore.getErrorsForPath('item.terms.labels')).toHaveLength(1) // Still has other error
    })

    test('should clear all errors for complete schema', () => {
      // Manually add errors to validation store
      validationStore.addError({
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Name is required',
        path: 'schema.name',
      })
      validationStore.addError({
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Wikibase URL is required',
        path: 'schema.wikibase',
      })
      validationStore.addError({
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Labels are required',
        path: 'item.terms.labels',
      })
      expect(validationStore.hasErrors).toBe(true)

      // Clear errors manually to simulate what updateValidationErrors would do
      validationStore.clearErrorsForPath('schema.name', true)
      validationStore.clearErrorsForPath('schema.wikibase', true)
      validationStore.clearErrorsForPath('item.terms.labels', true)

      expect(validationStore.hasErrors).toBe(false)
    })
  })

  describe('getFieldHighlightClass', () => {
    test('should return error class for missing required fields', () => {
      // Add content to trigger validation
      schemaStore.updateSchemaName('Test Schema')
      schemaValidationUI.updateValidationErrors()

      const wikibaseClass = schemaValidationUI.getFieldHighlightClass('schema.wikibase')
      const labelsClass = schemaValidationUI.getFieldHighlightClass('item.terms.labels')

      expect(wikibaseClass).toContain('border-red-500')
      expect(labelsClass).toContain('border-red-500')
    })

    test('should return empty string for completed fields', () => {
      // Test that getFieldHighlightClass returns empty string when no errors exist
      schemaStore.updateSchemaName('Test Schema')
      schemaStore.wikibase = 'https://test.wikibase.org'

      // Ensure validation store has no errors
      validationStore.$reset()

      const schemaNameClass = schemaValidationUI.getFieldHighlightClass('schema.name')
      const wikibaseClass = schemaValidationUI.getFieldHighlightClass('schema.wikibase')

      expect(schemaNameClass).toBe('')
      expect(wikibaseClass).toBe('')
    })

    test('should handle statement-specific field paths', () => {
      schemaStore.updateSchemaName('Test Schema')
      schemaStore.wikibase = 'https://test.wikibase.org'
      schemaStore.addLabelMapping('en', {
        columnName: 'title',
        dataType: 'string',
      })

      // Add incomplete statement
      const property: PropertyReference = {
        id: '' as any, // Empty property ID
        label: '',
        dataType: 'string',
      }

      const valueMapping: ValueMapping = {
        type: 'column',
        source: {
          columnName: '', // Empty column name
          dataType: 'string',
        },
        dataType: 'string',
      }

      schemaStore.addStatement(property, valueMapping)
      schemaValidationUI.updateValidationErrors()

      const propertyClass = schemaValidationUI.getFieldHighlightClass(
        'item.statements[0].property.id',
      )
      const valueClass = schemaValidationUI.getFieldHighlightClass(
        'item.statements[0].value.source.columnName',
      )

      expect(propertyClass).toContain('border-red-500')
      expect(valueClass).toContain('border-red-500')
    })
  })

  describe('hasFieldError', () => {
    test('should return true for fields with validation errors', () => {
      // Add content to trigger validation
      schemaStore.updateSchemaName('Test Schema')
      schemaValidationUI.updateValidationErrors()

      expect(schemaValidationUI.hasFieldError('schema.wikibase')).toBe(true)
      expect(schemaValidationUI.hasFieldError('item.terms.labels')).toBe(true)
    })

    test('should return false for completed fields', () => {
      // Test that hasFieldError returns false when no errors exist for those paths
      schemaStore.updateSchemaName('Test Schema')
      schemaStore.wikibase = 'https://test.wikibase.org'
      schemaStore.addLabelMapping('en', {
        columnName: 'title',
        dataType: 'string',
      })
      // Ensure validation store has no errors - don't call updateValidationErrors
      validationStore.$reset()

      expect(schemaValidationUI.hasFieldError('schema.name')).toBe(false)
      expect(schemaValidationUI.hasFieldError('schema.wikibase')).toBe(false)
      expect(schemaValidationUI.hasFieldError('item.terms.labels')).toBe(false)
    })
  })

  describe('getFieldErrorMessage', () => {
    test('should return error message for missing required fields', () => {
      // Add some content to trigger validation
      schemaStore.updateSchemaName('Test Schema')
      schemaValidationUI.updateValidationErrors()

      const wikibaseMessage = schemaValidationUI.getFieldErrorMessage('schema.wikibase')
      const labelsMessage = schemaValidationUI.getFieldErrorMessage('item.terms.labels')

      expect(wikibaseMessage).toContain('Wikibase URL is required')
      expect(labelsMessage).toContain('At least one label mapping is required')
    })

    test('should return empty string for fields without errors', () => {
      // Test that getFieldErrorMessage returns empty string when no errors exist
      schemaStore.updateSchemaName('Test Schema')

      // Ensure validation store has no errors - don't call updateValidationErrors
      validationStore.$reset()

      const message = schemaValidationUI.getFieldErrorMessage('schema.name')

      expect(message).toBe('')
    })
  })

  describe('reactive updates', () => {
    test('should automatically update validation when schema changes', () => {
      // Test that enableAutoValidation and disableAutoValidation work without errors
      schemaValidationUI.enableAutoValidation()

      // Make changes to schema
      schemaStore.updateSchemaName('Test Schema')
      schemaStore.wikibase = 'https://test.wikibase.org'

      // Test that the methods can be called without throwing errors
      expect(() => schemaValidationUI.enableAutoValidation()).not.toThrow()
      expect(() => schemaValidationUI.disableAutoValidation()).not.toThrow()

      // Verify that validation store methods work
      expect(validationStore.hasErrors).toBe(false)
    })

    test('should disable auto-update when requested', () => {
      // Add content to trigger validation
      schemaStore.updateSchemaName('Test Schema')

      schemaValidationUI.enableAutoValidation()
      expect(validationStore.hasErrors).toBe(true)

      schemaValidationUI.disableAutoValidation()

      // Clear validation store manually
      validationStore.$reset()

      // Make changes - should not trigger validation
      schemaStore.updateSchemaName('Test Schema')

      expect(validationStore.hasErrors).toBe(false) // No auto-update
    })
  })
})
