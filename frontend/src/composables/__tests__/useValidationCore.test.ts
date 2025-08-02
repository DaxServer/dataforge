import { describe, test, expect } from 'bun:test'
import { useValidationCore } from '@frontend/composables/useValidationCore'
import type { ColumnInfo } from '@frontend/types/wikibase-schema'
import type { DropTarget } from '@frontend/types/drag-drop'

describe('useValidationCore', () => {
  const { validateColumnForTarget, validateForStyling, validateForDrop, isAliasDuplicate } =
    useValidationCore()

  describe('Core Validation', () => {
    test('should validate compatible data types', () => {
      const columnInfo: ColumnInfo = {
        name: 'test_column',
        dataType: 'string',
        nullable: false,
        sampleValues: ['test1', 'test2'],
      }

      const target: DropTarget = {
        path: 'item.terms.labels.en',
        type: 'label',
        acceptedTypes: ['string'],
        isRequired: false,
      }

      const result = validateColumnForTarget(columnInfo, target)
      expect(result.isValid).toBe(true)
    })

    test('should reject incompatible data types', () => {
      const columnInfo: ColumnInfo = {
        name: 'test_column',
        dataType: 'number',
        nullable: false,
        sampleValues: ['1', '2', '3'],
      }

      const target: DropTarget = {
        path: 'item.terms.labels.en',
        type: 'label',
        acceptedTypes: ['string'],
        isRequired: false,
      }

      const result = validateColumnForTarget(columnInfo, target)
      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('incompatible_data_type')
    })

    test('should reject nullable columns for required fields', () => {
      const columnInfo: ColumnInfo = {
        name: 'test_column',
        dataType: 'string',
        nullable: true,
        sampleValues: ['test1', 'test2'],
      }

      const target: DropTarget = {
        path: 'item.terms.labels.en',
        type: 'label',
        acceptedTypes: ['string'],
        isRequired: true,
      }

      const result = validateColumnForTarget(columnInfo, target)
      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('nullable_required_field')
    })

    test('should validate length constraints for labels', () => {
      const columnInfo: ColumnInfo = {
        name: 'test_column',
        dataType: 'string',
        nullable: false,
        sampleValues: ['a'.repeat(300)], // Too long for label
      }

      const target: DropTarget = {
        path: 'item.terms.labels.en',
        type: 'label',
        acceptedTypes: ['string'],
        isRequired: false,
      }

      const result = validateColumnForTarget(columnInfo, target)
      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('length_constraint')
    })

    test('should validate length constraints for aliases', () => {
      const columnInfo: ColumnInfo = {
        name: 'test_column',
        dataType: 'string',
        nullable: false,
        sampleValues: ['a'.repeat(150)], // Too long for alias
      }

      const target: DropTarget = {
        path: 'item.terms.aliases.en',
        type: 'alias',
        acceptedTypes: ['string'],
        isRequired: false,
      }

      const result = validateColumnForTarget(columnInfo, target)
      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('length_constraint')
    })

    test('should require property ID for statements', () => {
      const columnInfo: ColumnInfo = {
        name: 'test_column',
        dataType: 'string',
        nullable: false,
        sampleValues: ['test1', 'test2'],
      }

      const target: DropTarget = {
        path: 'item.statements[0].value',
        type: 'statement',
        acceptedTypes: ['string'],
        isRequired: false,
      }

      const result = validateColumnForTarget(columnInfo, target)
      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('missing_property_id')
    })

    test('should accept statements with property ID', () => {
      const columnInfo: ColumnInfo = {
        name: 'test_column',
        dataType: 'string',
        nullable: false,
        sampleValues: ['test1', 'test2'],
      }

      const target: DropTarget = {
        path: 'item.statements[0].value',
        type: 'statement',
        acceptedTypes: ['string'],
        isRequired: false,
        propertyId: 'P123',
      }

      const result = validateColumnForTarget(columnInfo, target)
      expect(result.isValid).toBe(true)
    })
  })

  describe('Alias Deduplication', () => {
    test('should detect duplicate aliases', () => {
      const columnInfo: ColumnInfo = {
        name: 'existing_column',
        dataType: 'string',
        nullable: false,
        sampleValues: ['alias1', 'alias2'],
      }

      const existingAliases = [
        { columnName: 'existing_column', dataType: 'string' },
        { columnName: 'other_column', dataType: 'string' },
      ]

      const result = isAliasDuplicate(columnInfo, existingAliases)
      expect(result).toBe(true)
    })

    test('should not detect duplicates for different columns', () => {
      const columnInfo: ColumnInfo = {
        name: 'new_column',
        dataType: 'string',
        nullable: false,
        sampleValues: ['alias1', 'alias2'],
      }

      const existingAliases = [
        { columnName: 'existing_column', dataType: 'string' },
        { columnName: 'other_column', dataType: 'string' },
      ]

      const result = isAliasDuplicate(columnInfo, existingAliases)
      expect(result).toBe(false)
    })

    test('should not detect duplicates for different data types', () => {
      const columnInfo: ColumnInfo = {
        name: 'existing_column',
        dataType: 'number',
        nullable: false,
        sampleValues: ['1', '2', '3'],
      }

      const existingAliases = [
        { columnName: 'existing_column', dataType: 'string' },
        { columnName: 'other_column', dataType: 'string' },
      ]

      const result = isAliasDuplicate(columnInfo, existingAliases)
      expect(result).toBe(false)
    })
  })

  describe('Validation for Styling vs Drop', () => {
    test('validateForStyling should ignore duplicates', () => {
      const columnInfo: ColumnInfo = {
        name: 'test_column',
        dataType: 'string',
        nullable: false,
        sampleValues: ['alias1', 'alias2'],
      }

      const target: DropTarget = {
        path: 'item.terms.aliases.en',
        type: 'alias',
        acceptedTypes: ['string'],
        isRequired: false,
      }

      const result = validateForStyling(columnInfo, target)
      expect(result.isValid).toBe(true)
    })

    test('validateForDrop should check duplicates for aliases', () => {
      const columnInfo: ColumnInfo = {
        name: 'existing_column',
        dataType: 'string',
        nullable: false,
        sampleValues: ['alias1', 'alias2'],
      }

      const target: DropTarget = {
        path: 'item.terms.aliases.en',
        type: 'alias',
        acceptedTypes: ['string'],
        isRequired: false,
      }

      const existingAliases = [{ columnName: 'existing_column', dataType: 'string' }]

      const result = validateForDrop(columnInfo, target, existingAliases)
      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('duplicate_alias')
    })

    test('validateForDrop should pass for non-duplicate aliases', () => {
      const columnInfo: ColumnInfo = {
        name: 'new_column',
        dataType: 'string',
        nullable: false,
        sampleValues: ['alias1', 'alias2'],
      }

      const target: DropTarget = {
        path: 'item.terms.aliases.en',
        type: 'alias',
        acceptedTypes: ['string'],
        isRequired: false,
      }

      const existingAliases = [{ columnName: 'existing_column', dataType: 'string' }]

      const result = validateForDrop(columnInfo, target, existingAliases)
      expect(result.isValid).toBe(true)
    })

    test('validateForDrop should not check duplicates for non-alias types', () => {
      const columnInfo: ColumnInfo = {
        name: 'existing_column',
        dataType: 'string',
        nullable: false,
        sampleValues: ['label1', 'label2'],
      }

      const target: DropTarget = {
        path: 'item.terms.labels.en',
        type: 'label',
        acceptedTypes: ['string'],
        isRequired: false,
      }

      const existingAliases = [{ columnName: 'existing_column', dataType: 'string' }]

      const result = validateForDrop(columnInfo, target, existingAliases)
      expect(result.isValid).toBe(true)
    })
  })
})
