import { beforeEach, describe, expect, mock, test } from 'bun:test'
import type {
  PropertyReference,
  StatementSchemaMapping,
  ValueMapping,
} from '@backend/api/project/project.wikibase'
import { useSchemaCompletenessValidation } from '@frontend/features/wikibase-schema/composables/useSchemaCompletenessValidation'
import { useSchemaStore } from '@frontend/features/wikibase-schema/stores/schema.store'
import { useValidationStore } from '@frontend/features/wikibase-schema/stores/validation.store'
import type { UUID } from 'crypto'
import { createPinia, setActivePinia } from 'pinia'

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
      schemaStore.wikibase = 'wikidata'

      const result = completenessValidation.validateSchemaCompleteness()

      expect(result.missingRequiredFields).not.toContain('schema.name')
      expect(result.missingRequiredFields).not.toContain('schema.wikibase')
    })

    test('should validate complete schema with labels', () => {
      schemaStore.updateSchemaName('Test Schema')
      schemaStore.wikibase = 'wikidata'
      schemaStore.addLabelMapping('en', {
        columnName: 'title',
        dataType: 'string',
      })

      const result = completenessValidation.validateSchemaCompleteness()

      expect(result.missingRequiredFields).not.toContain('item.terms.labels')
    })

    test('should validate statements with property and value mappings', () => {
      schemaStore.updateSchemaName('Test Schema')
      schemaStore.wikibase = 'wikidata'
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
      schemaStore.wikibase = 'wikidata'
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
      schemaStore.wikibase = 'wikidata'
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
      schemaStore.wikibase = 'wikidata'
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
      schemaStore.wikibase = 'wikidata'
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

  describe('getSchemaCompletionInfo', () => {
    test('should return correct completion info for schema with content', () => {
      const mockSchema: WikibaseSchemaMapping = {
        id: Bun.randomUUIDv7() as UUID,
        projectId: Bun.randomUUIDv7() as UUID,
        name: 'Test Schema',
        wikibase: 'https://test.wikibase.org',
        schema: {
          terms: {
            labels: {
              en: { columnName: 'title', dataType: 'string' },
              fr: { columnName: 'titre', dataType: 'string' },
            },
            descriptions: {
              en: { columnName: 'description', dataType: 'string' },
            },
            aliases: {
              en: [
                { columnName: 'alias1', dataType: 'string' },
                { columnName: 'alias2', dataType: 'string' },
              ],
            },
          },
          statements: [
            {
              id: Bun.randomUUIDv7() as UUID,
              property: { id: 'P31' as any, dataType: 'wikibase-item' },
              value: {
                type: 'column',
                source: { columnName: 'type', dataType: 'string' },
                dataType: 'wikibase-item',
              },
              rank: 'normal',
              qualifiers: [],
              references: [],
            },
          ],
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      const info = completenessValidation.getSchemaCompletionInfo(mockSchema)

      expect(info.labelCount).toBe(2)
      expect(info.descriptionCount).toBe(1)
      expect(info.aliasCount).toBe(1) // One language with aliases
      expect(info.statementCount).toBe(1)
      expect(info.totalTerms).toBe(4) // 2 labels + 1 description + 1 alias language
      expect(info.isComplete).toBe(true)
    })

    test('should handle schema with null item', () => {
      const mockSchema: WikibaseSchemaMapping = {
        id: Bun.randomUUIDv7() as UUID,
        projectId: Bun.randomUUIDv7() as UUID,
        name: 'Test Schema',
        wikibase: 'https://test.wikibase.org',
        schema: null as any,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      const info = completenessValidation.getSchemaCompletionInfo(mockSchema)

      expect(info.labelCount).toBe(0)
      expect(info.descriptionCount).toBe(0)
      expect(info.aliasCount).toBe(0)
      expect(info.statementCount).toBe(0)
      expect(info.totalTerms).toBe(0)
      expect(info.isComplete).toBe(false)
    })

    test('should handle null schema', () => {
      const info = completenessValidation.getSchemaCompletionInfo(null as any)

      expect(info.labelCount).toBe(0)
      expect(info.descriptionCount).toBe(0)
      expect(info.aliasCount).toBe(0)
      expect(info.statementCount).toBe(0)
      expect(info.totalTerms).toBe(0)
      expect(info.isComplete).toBe(false)
    })

    test('should handle empty schema', () => {
      const mockSchema: WikibaseSchemaMapping = {
        id: Bun.randomUUIDv7() as UUID,
        projectId: Bun.randomUUIDv7() as UUID,
        name: 'Empty Schema',
        wikibase: 'https://test.wikibase.org',
        schema: {
          terms: {
            labels: {},
            descriptions: {},
            aliases: {},
          },
          statements: [],
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      const info = completenessValidation.getSchemaCompletionInfo(mockSchema)

      expect(info.labelCount).toBe(0)
      expect(info.descriptionCount).toBe(0)
      expect(info.aliasCount).toBe(0)
      expect(info.statementCount).toBe(0)
      expect(info.totalTerms).toBe(0)
      expect(info.isComplete).toBe(false)
    })
  })
})
