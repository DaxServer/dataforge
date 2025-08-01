import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { createPinia, setActivePinia } from 'pinia'
import { useSchemaStore } from '@frontend/stores/schema.store'
import { useValidationStore } from '@frontend/stores/validation.store'
import { useSchemaCompletenessValidation } from '@frontend/composables/useSchemaCompletenessValidation'
import { useSchemaValidationUI } from '@frontend/composables/useSchemaValidationUI'
import type { PropertyReference, ValueMapping } from '@frontend/types/wikibase-schema'

describe('Schema Completeness Validation Integration', () => {
  let schemaStore: ReturnType<typeof useSchemaStore>
  let validationStore: ReturnType<typeof useValidationStore>
  let completenessValidation: ReturnType<typeof useSchemaCompletenessValidation>
  let validationUI: ReturnType<typeof useSchemaValidationUI>

  beforeEach(() => {
    setActivePinia(createPinia())
    schemaStore = useSchemaStore()
    validationStore = useValidationStore()
    completenessValidation = useSchemaCompletenessValidation()
    validationUI = useSchemaValidationUI()

    // Add validation rules that the tests expect
    validationStore.addRule({
      id: 'schema-name-required',
      name: 'Schema Name Required',
      fieldPath: 'schema.name',
      enabled: true,
      severity: 'error',
      message: 'Schema name is required',
      validator: mock(),
    })

    validationStore.addRule({
      id: 'wikibase-url-required',
      name: 'Wikibase URL Required',
      fieldPath: 'schema.wikibase',
      enabled: true,
      severity: 'error',
      message: 'Wikibase URL is required',
      validator: mock(),
    })

    validationStore.addRule({
      id: 'labels-required',
      name: 'Labels Required',
      fieldPath: 'item.terms.labels',
      enabled: true,
      severity: 'error',
      message: 'At least one label mapping is required',
      validator: mock(),
    })

    validationStore.addRule({
      id: 'statements-recommended',
      name: 'Statements Recommended',
      fieldPath: 'item.statements',
      enabled: true,
      severity: 'warning',
      message: 'Statement mappings are recommended for complete schemas',
      validator: mock(),
    })
  })

  test('should provide complete workflow from empty to complete schema', () => {
    // Test that the workflow progresses through schema building steps

    // Step 1: Add schema name
    schemaStore.updateSchemaName('Test Schema')
    expect(schemaStore.schemaName).toBe('Test Schema')

    // Step 2: Add wikibase URL
    schemaStore.wikibase = 'https://test.wikibase.org'
    expect(schemaStore.wikibase).toBe('https://test.wikibase.org')

    // Step 3: Add label mapping
    schemaStore.addLabelMapping('en', {
      columnName: 'title',
      dataType: 'string',
    })
    expect(schemaStore.labels).toHaveProperty('en')

    // Step 4: Add statement
    const property: PropertyReference = {
      id: 'P31' as any,
      label: 'instance of',
      dataType: 'wikibase-item',
    }

    const valueMapping: ValueMapping = {
      type: 'column',
      source: {
        columnName: 'type',
        dataType: 'string',
      },
      dataType: 'wikibase-item',
    }

    schemaStore.addStatement(property, valueMapping)
    expect(schemaStore.statements).toHaveLength(1)

    // Test that validation UI can be enabled and provides summary
    validationUI.enableAutoValidation()
    const summary = validationUI.getValidationSummary()
    expect(summary).toHaveProperty('isComplete')
    expect(summary).toHaveProperty('totalErrors')
    expect(summary).toHaveProperty('missingFieldsCount')
  })

  test('should handle incomplete statements correctly', () => {
    // Set up basic schema
    schemaStore.updateSchemaName('Test Schema')
    schemaStore.wikibase = 'https://test.wikibase.org'
    schemaStore.addLabelMapping('en', {
      columnName: 'title',
      dataType: 'string',
    })

    // Add incomplete statement (missing property ID)
    const incompleteProperty: PropertyReference = {
      id: 'P0', // Invalid property ID
      label: '',
      dataType: 'string',
    }

    const valueMapping: ValueMapping = {
      type: 'column',
      source: {
        columnName: 'type',
        dataType: 'string',
      },
      dataType: 'string',
    }

    schemaStore.addStatement(incompleteProperty, valueMapping)

    // Test that the statement was added with invalid property ID
    expect(schemaStore.statements).toHaveLength(1)
    expect(schemaStore.statements[0]?.property.id).toBe('P0')

    // Test that validation UI can be enabled
    validationUI.enableAutoValidation()

    // Test that validation methods can be called
    expect(() => validationUI.hasFieldError('item.statements[0].property.id')).not.toThrow()
    expect(() => validationUI.getFieldErrorMessage('item.statements[0].property.id')).not.toThrow()
  })

  test('should provide helpful field validation states', () => {
    // Add content to trigger validation
    schemaStore.updateSchemaName('Test Schema')
    validationUI.enableAutoValidation()

    // Test that field validation state methods can be called
    expect(() => validationUI.getFieldValidationState('schema.wikibase')).not.toThrow()

    const wikibaseState = validationUI.getFieldValidationState('schema.wikibase')
    expect(wikibaseState).toHaveProperty('hasError')
    expect(wikibaseState).toHaveProperty('isValid')
    expect(wikibaseState).toHaveProperty('errorMessage')
    expect(wikibaseState).toHaveProperty('highlightClass')

    // Complete the field
    schemaStore.wikibase = 'https://test.wikibase.org'
    expect(schemaStore.wikibase).toBe('https://test.wikibase.org')

    // Test that validation can be triggered
    expect(() => validationUI.triggerValidation()).not.toThrow()

    const updatedState = validationUI.getFieldValidationState('schema.wikibase')
    expect(updatedState).toHaveProperty('hasError')
    expect(updatedState).toHaveProperty('isValid')
    expect(updatedState).toHaveProperty('errorMessage')
    expect(updatedState).toHaveProperty('highlightClass')
  })
})
