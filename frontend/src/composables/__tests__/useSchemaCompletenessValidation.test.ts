import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { createPinia, setActivePinia } from 'pinia'
import { useSchemaCompletenessValidation } from '@frontend/composables/useSchemaCompletenessValidation'
import { useSchemaStore } from '@frontend/stores/schema.store'
import { useValidationStore } from '@frontend/stores/validation.store'
import type {
  StatementSchemaMapping,
  PropertyReference,
  ValueMapping,
} from '@frontend/types/wikibase-schema'
import type { UUID } from 'crypto'

describe('useSchemaCompletenessValidation', () => {
  let schemaStore: ReturnType<typeof useSchemaStore>
  let validationRulesStore: ReturnType<typeof useValidationStore>
  let completenessValidation: ReturnType<typeof useSchemaCompletenessValidation>

  beforeEach(() => {
    setActivePinia(createPinia())
    schemaStore = useSchemaStore()
    validationRulesStore = useValidationStore()

    // Add required validation rules with simple mocks
    validationRulesStore.addRule({
      id: 'schema-name-required',
      name: 'Schema Name Required',
      fieldPath: 'schema.name',
      message: 'Schema name is required',
      severity: 'error',
      enabled: true,
      validator: mock(() => true),
    })

    validationRulesStore.addRule({
      id: 'wikibase-url-required',
      name: 'Wikibase URL Required',
      fieldPath: 'schema.wikibase',
      message: 'Wikibase URL is required',
      severity: 'error',
      enabled: true,
      validator: mock(() => true),
    })

    validationRulesStore.addRule({
      id: 'labels-required',
      name: 'Labels Required',
      fieldPath: 'item.terms.labels',
      message: 'At least one label mapping is required',
      severity: 'error',
      enabled: true,
      validator: mock(() => true),
    })

    validationRulesStore.addRule({
      id: 'statements-recommended',
      name: 'Statements Recommended',
      fieldPath: 'item.statements',
      message: 'Statement mappings are recommended for completeness',
      severity: 'warning',
      enabled: true,
      validator: mock(() => true),
    })

    completenessValidation = useSchemaCompletenessValidation()
  })

  describe('validateSchemaCompleteness', () => {
    test('should validate schema with basic information', () => {
      schemaStore.updateSchemaName('Test Schema')
      schemaStore.wikibase = 'https://test.wikibase.org'

      const result = completenessValidation.validateSchemaCompleteness()

      expect(result.missingRequiredFields).not.toContain('schema.name')
      expect(result.missingRequiredFields).not.toContain('schema.wikibase')
    })

    test('should validate complete schema with labels', () => {
      schemaStore.updateSchemaName('Test Schema')
      schemaStore.wikibase = 'https://test.wikibase.org'
      schemaStore.addLabelMapping('en', {
        columnName: 'title',
        dataType: 'string',
      })

      const result = completenessValidation.validateSchemaCompleteness()

      expect(result.missingRequiredFields).not.toContain('item.terms.labels')
    })

    test('should validate statements with property and value mappings', () => {
      schemaStore.updateSchemaName('Test Schema')
      schemaStore.wikibase = 'https://test.wikibase.org'
      schemaStore.addLabelMapping('en', {
        columnName: 'title',
        dataType: 'string',
      })

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

      const result = completenessValidation.validateSchemaCompleteness()

      expect(result.isComplete).toBe(true)
    })

    test('should identify incomplete statements without value mappings', () => {
      schemaStore.updateSchemaName('Test Schema')
      schemaStore.wikibase = 'https://test.wikibase.org'
      schemaStore.addLabelMapping('en', {
        columnName: 'title',
        dataType: 'string',
      })

      // Add statement with incomplete value mapping
      const incompleteStatement: StatementSchemaMapping = {
        id: 'test-id' as UUID,
        property: {
          id: 'P31' as any,
          label: 'instance of',
          dataType: 'wikibase-item',
        },
        value: {
          type: 'column',
          source: {
            columnName: '', // Empty column name makes it incomplete
            dataType: 'string',
          },
          dataType: 'wikibase-item',
        },
        rank: 'normal',
        qualifiers: [],
        references: [],
      }

      schemaStore.statements.push(incompleteStatement)

      const result = completenessValidation.validateSchemaCompleteness()

      expect(result.missingRequiredFields).toEqual(['item.statements[0].value.source.columnName'])
      expect(result.isComplete).toBe(false)
    })
  })

  describe('getRequiredFieldHighlights', () => {
    test('should return empty array for complete schema', () => {
      schemaStore.updateSchemaName('Test Schema')
      schemaStore.wikibase = 'https://test.wikibase.org'
      schemaStore.addLabelMapping('en', {
        columnName: 'title',
        dataType: 'string',
      })

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

      const highlights = completenessValidation.getRequiredFieldHighlights()

      expect(highlights).toHaveLength(0)
    })

    test('should return empty array for completely empty schema', () => {
      // Ensure schema is completely empty
      const highlights = completenessValidation.getRequiredFieldHighlights()

      // Empty schemas should not show validation errors
      expect(highlights).toHaveLength(0)
    })
  })

  describe('isSchemaComplete', () => {
    test('should return true for complete schema', () => {
      schemaStore.updateSchemaName('Test Schema')
      schemaStore.wikibase = 'https://test.wikibase.org'
      schemaStore.addLabelMapping('en', {
        columnName: 'title',
        dataType: 'string',
      })

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

      const isComplete = completenessValidation.isSchemaComplete()

      expect(isComplete).toBe(true)
    })
  })

  describe('getMissingRequiredFields', () => {
    test('should return empty array for complete schema', () => {
      schemaStore.updateSchemaName('Test Schema')
      schemaStore.wikibase = 'https://test.wikibase.org'
      schemaStore.addLabelMapping('en', {
        columnName: 'title',
        dataType: 'string',
      })

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

      const missingFields = completenessValidation.getMissingRequiredFields()

      expect(missingFields).toHaveLength(0)
    })

    test('should allow custom validation rules', () => {
      const mockValidator = mock(() => false)

      // Add a custom validation rule with simple mock
      validationRulesStore.addRule({
        id: 'custom-description-required',
        name: 'Description Required',
        fieldPath: 'item.terms.descriptions',
        message: 'At least one description mapping is required',
        severity: 'warning',
        enabled: true,
        validator: mockValidator,
      })

      // Add some content to trigger validation
      schemaStore.updateSchemaName('Test Schema')

      // Should include the custom rule in missing fields (mock returns false)
      let missingFields = completenessValidation.getMissingRequiredFields()
      expect(missingFields).toContain('item.terms.descriptions')

      // Change mock to return true
      mockValidator.mockReturnValue(true)

      // Should no longer be missing (mock now returns true)
      missingFields = completenessValidation.getMissingRequiredFields()
      expect(missingFields).not.toContain('item.terms.descriptions')
    })
  })
})
