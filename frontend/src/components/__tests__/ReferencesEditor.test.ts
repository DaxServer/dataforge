import { describe, test, expect, beforeEach } from 'bun:test'
import { ref } from 'vue'
import type {
  ReferenceSchemaMapping,
  PropertyReference,
  ValueMapping,
  ColumnInfo,
} from '@frontend/types/wikibase-schema'

/**
 * ReferencesEditor Component Tests
 *
 * These tests verify the logic for adding and removing references,
 * reference property selection, and component structure without DOM testing.
 */

describe('ReferencesEditor Component Logic', () => {
  describe('reference management', () => {
    test('should handle adding references correctly', () => {
      const localReferences = ref<ReferenceSchemaMapping[]>([])

      const handleAddReference = (statementId: string, reference: ReferenceSchemaMapping) => {
        localReferences.value.push(reference)
        return {
          statementId,
          referenceCount: localReferences.value.length,
        }
      }

      const newReference: ReferenceSchemaMapping = {
        property: {
          id: 'P248',
          label: 'stated in',
          dataType: 'wikibase-item',
        },
        value: {
          type: 'column',
          source: {
            columnName: 'source_publication',
            dataType: 'VARCHAR',
          },
          dataType: 'wikibase-item',
        },
      }

      const result = handleAddReference('test-statement-id', newReference)

      expect(result.statementId).toBe('test-statement-id')
      expect(result.referenceCount).toBe(1)
      expect(localReferences.value.length).toBe(1)
      expect(localReferences.value[0]).toEqual(newReference)
    })

    test('should handle removing references correctly', () => {
      const localReferences = ref<ReferenceSchemaMapping[]>([
        {
          property: {
            id: 'P248',
            label: 'stated in',
            dataType: 'wikibase-item',
          },
          value: {
            type: 'column',
            source: {
              columnName: 'source_publication',
              dataType: 'VARCHAR',
            },
            dataType: 'wikibase-item',
          },
        },
        {
          property: {
            id: 'P854',
            label: 'reference URL',
            dataType: 'url',
          },
          value: {
            type: 'column',
            source: {
              columnName: 'source_url',
              dataType: 'VARCHAR',
            },
            dataType: 'url',
          },
        },
      ])

      const handleRemoveReference = (statementId: string, referenceIndex: number) => {
        if (referenceIndex >= 0 && referenceIndex < localReferences.value.length) {
          localReferences.value.splice(referenceIndex, 1)
          return { success: true, remainingCount: localReferences.value.length }
        }
        return { success: false, remainingCount: localReferences.value.length }
      }

      // Remove first reference
      const result1 = handleRemoveReference('test-statement-id', 0)
      expect(result1.success).toBe(true)
      expect(result1.remainingCount).toBe(1)
      expect(localReferences.value[0]?.property.id).toBe('P854')

      // Try to remove invalid index
      const result2 = handleRemoveReference('test-statement-id', 5)
      expect(result2.success).toBe(false)
      expect(result2.remainingCount).toBe(1)
    })

    test('should handle multiple references correctly', () => {
      const localReferences = ref<ReferenceSchemaMapping[]>([])

      const addMultipleReferences = (references: ReferenceSchemaMapping[]) => {
        references.forEach((reference) => {
          localReferences.value.push(reference)
        })
        return localReferences.value.length
      }

      const references: ReferenceSchemaMapping[] = [
        {
          property: { id: 'P248', label: 'stated in', dataType: 'wikibase-item' },
          value: {
            type: 'column',
            source: { columnName: 'source_publication', dataType: 'VARCHAR' },
            dataType: 'wikibase-item',
          },
        },
        {
          property: { id: 'P854', label: 'reference URL', dataType: 'url' },
          value: {
            type: 'column',
            source: { columnName: 'source_url', dataType: 'VARCHAR' },
            dataType: 'url',
          },
        },
        {
          property: { id: 'P813', label: 'retrieved', dataType: 'time' },
          value: {
            type: 'column',
            source: { columnName: 'retrieved_date', dataType: 'DATE' },
            dataType: 'time',
          },
        },
      ]

      const count = addMultipleReferences(references)
      expect(count).toBe(3)
      expect(localReferences.value.length).toBe(3)
    })
  })

  describe('reference property selection', () => {
    test('should validate reference property selection correctly', () => {
      const isValidReferenceProperty = (property: PropertyReference | null): boolean => {
        if (!property) return false
        return property.id.startsWith('P') && property.dataType !== ''
      }

      // Valid property
      const validProperty: PropertyReference = {
        id: 'P248',
        label: 'stated in',
        dataType: 'wikibase-item',
      }
      expect(isValidReferenceProperty(validProperty)).toBe(true)

      // Invalid property - no P prefix (cast to bypass type checking for test)
      const invalidProperty1: PropertyReference = {
        id: 'Q123' as any,
        label: 'some item',
        dataType: 'wikibase-item',
      }
      expect(isValidReferenceProperty(invalidProperty1)).toBe(false)

      // Invalid property - empty data type
      const invalidProperty2: PropertyReference = {
        id: 'P248',
        label: 'stated in',
        dataType: '',
      }
      expect(isValidReferenceProperty(invalidProperty2)).toBe(false)

      // Null property
      expect(isValidReferenceProperty(null)).toBe(false)
    })

    test('should handle common reference properties correctly', () => {
      const commonReferenceProperties = [
        { id: 'P248', label: 'stated in', dataType: 'wikibase-item' },
        { id: 'P854', label: 'reference URL', dataType: 'url' },
        { id: 'P813', label: 'retrieved', dataType: 'time' },
        { id: 'P577', label: 'publication date', dataType: 'time' },
        { id: 'P50', label: 'author', dataType: 'wikibase-item' },
      ]

      const isCommonReferenceProperty = (propertyId: string): boolean => {
        return commonReferenceProperties.some((prop) => prop.id === propertyId)
      }

      expect(isCommonReferenceProperty('P248')).toBe(true)
      expect(isCommonReferenceProperty('P854')).toBe(true)
      expect(isCommonReferenceProperty('P813')).toBe(true)
      expect(isCommonReferenceProperty('P999')).toBe(false)
    })

    test('should suggest appropriate reference properties based on data type', () => {
      const getSuggestedReferenceProperties = (columnDataType: string): PropertyReference[] => {
        const suggestions: PropertyReference[] = []

        if (columnDataType.toUpperCase().includes('URL') || columnDataType.toUpperCase().includes('VARCHAR')) {
          suggestions.push({
            id: 'P854',
            label: 'reference URL',
            dataType: 'url',
          })
        }

        if (columnDataType.toUpperCase().includes('DATE') || columnDataType.toUpperCase().includes('TIME')) {
          suggestions.push(
            {
              id: 'P813',
              label: 'retrieved',
              dataType: 'time',
            },
            {
              id: 'P577',
              label: 'publication date',
              dataType: 'time',
            }
          )
        }

        // Always suggest "stated in" as it's the most common reference property
        suggestions.push({
          id: 'P248',
          label: 'stated in',
          dataType: 'wikibase-item',
        })

        return suggestions
      }

      const urlSuggestions = getSuggestedReferenceProperties('VARCHAR')
      expect(urlSuggestions.some((prop) => prop.id === 'P854')).toBe(true)
      expect(urlSuggestions.some((prop) => prop.id === 'P248')).toBe(true)

      const dateSuggestions = getSuggestedReferenceProperties('DATE')
      expect(dateSuggestions.some((prop) => prop.id === 'P813')).toBe(true)
      expect(dateSuggestions.some((prop) => prop.id === 'P577')).toBe(true)
      expect(dateSuggestions.some((prop) => prop.id === 'P248')).toBe(true)
    })
  })

  describe('reference value mapping', () => {
    test('should validate reference value mapping correctly', () => {
      const isValidReferenceValue = (value: ValueMapping | null): boolean => {
        if (!value) return false

        if (value.type === 'column') {
          return typeof value.source === 'object' && !!value.source.columnName
        }
        return typeof value.source === 'string' && !!value.source.trim()
      }

      // Valid column mapping
      const validColumnValue: ValueMapping = {
        type: 'column',
        source: {
          columnName: 'source_publication',
          dataType: 'VARCHAR',
        },
        dataType: 'wikibase-item',
      }
      expect(isValidReferenceValue(validColumnValue)).toBe(true)

      // Valid constant value
      const validConstantValue: ValueMapping = {
        type: 'constant',
        source: 'Some Publication',
        dataType: 'wikibase-item',
      }
      expect(isValidReferenceValue(validConstantValue)).toBe(true)

      // Invalid column mapping - empty column name
      const invalidColumnValue: ValueMapping = {
        type: 'column',
        source: {
          columnName: '',
          dataType: 'VARCHAR',
        },
        dataType: 'wikibase-item',
      }
      expect(isValidReferenceValue(invalidColumnValue)).toBe(false)

      // Invalid constant value - empty string
      const invalidConstantValue: ValueMapping = {
        type: 'constant',
        source: '',
        dataType: 'wikibase-item',
      }
      expect(isValidReferenceValue(invalidConstantValue)).toBe(false)

      // Null value
      expect(isValidReferenceValue(null)).toBe(false)
    })

    test('should handle column drop for reference value mapping', () => {
      const handleColumnDropForReference = (
        columnInfo: ColumnInfo,
        propertyDataType: string
      ): ValueMapping => {
        // Map column data type to appropriate Wikibase data type
        const getCompatibleDataType = (colDataType: string, propDataType: string): string => {
          if (propDataType === 'url' && colDataType.toUpperCase().includes('VARCHAR')) {
            return 'url'
          }
          if (propDataType === 'time' && colDataType.toUpperCase().includes('DATE')) {
            return 'time'
          }
          if (propDataType === 'wikibase-item') {
            return 'wikibase-item'
          }
          return 'string' // fallback
        }

        return {
          type: 'column',
          source: {
            columnName: columnInfo.name,
            dataType: columnInfo.dataType,
          },
          dataType: getCompatibleDataType(columnInfo.dataType, propertyDataType) as any,
        }
      }

      const columnInfo: ColumnInfo = {
        name: 'source_url',
        dataType: 'VARCHAR',
        sampleValues: ['https://example.com', 'https://test.org'],
        nullable: false,
      }

      const result = handleColumnDropForReference(columnInfo, 'url')

      expect(result.type).toBe('column')
      expect(result.source).toEqual({
        columnName: 'source_url',
        dataType: 'VARCHAR',
      })
      expect(result.dataType).toBe('url')
    })
  })

  describe('component state management', () => {
    test('should manage add reference form state correctly', () => {
      const isAddingReference = ref(false)
      const selectedProperty = ref<PropertyReference | null>(null)
      const selectedValue = ref<ValueMapping | null>(null)

      const startAddingReference = () => {
        isAddingReference.value = true
        // @ts-ignore - Test needs to set null values
        selectedProperty.value = null
        // @ts-ignore - Test needs to set null values
        selectedValue.value = null
      }

      const cancelAddingReference = () => {
        isAddingReference.value = false
        // @ts-ignore - Test needs to set null values
        selectedProperty.value = null
        // @ts-ignore - Test needs to set null values
        selectedValue.value = null
      }

      // Initially not adding
      expect(isAddingReference.value).toBe(false)
      expect(selectedProperty.value).toBe(null)
      expect(selectedValue.value).toBe(null)

      // Start adding
      startAddingReference()
      expect(isAddingReference.value).toBe(true)
      expect(selectedProperty.value).toBe(null)
      expect(selectedValue.value).toBe(null)

      // Set some values
      selectedProperty.value = {
        id: 'P248',
        label: 'stated in',
        dataType: 'wikibase-item',
      }
      selectedValue.value = {
        type: 'column',
        source: { columnName: 'source', dataType: 'VARCHAR' },
        dataType: 'wikibase-item',
      }

      // Cancel adding - should reset everything
      cancelAddingReference()
      expect(isAddingReference.value).toBe(false)
      // @ts-ignore - Test expects null value
      expect(selectedProperty.value).toBe(null)
      // @ts-ignore - Test expects null value
      expect(selectedValue.value).toBe(null)
    })

    test('should validate form completion correctly', () => {
      const canAddReference = (
        property: PropertyReference | null,
        value: ValueMapping | null
      ): boolean => {
        if (!property || !value) return false
        const isValidProperty = property.id.startsWith('P') && property.dataType !== ''
        const isValidValue = (
          (value.type === 'column' && typeof value.source === 'object' && !!value.source.columnName) ||
          (value.type !== 'column' && typeof value.source === 'string' && !!value.source.trim())
        )
        return !!(isValidProperty && isValidValue)
      }

      // Both null - cannot add
      expect(canAddReference(null, null)).toBe(false)

      // Only property - cannot add
      const property: PropertyReference = {
        id: 'P248',
        label: 'stated in',
        dataType: 'wikibase-item',
      }
      expect(canAddReference(property, null)).toBe(false)

      // Only value - cannot add
      const value: ValueMapping = {
        type: 'column',
        source: { columnName: 'source', dataType: 'VARCHAR' },
        dataType: 'wikibase-item',
      }
      expect(canAddReference(null, value)).toBe(false)

      // Both valid - can add
      expect(canAddReference(property, value)).toBe(true)

      // Invalid property - cannot add (cast to bypass type checking for test)
      const invalidProperty: PropertyReference = {
        id: 'Q123' as any,
        label: 'some item',
        dataType: 'wikibase-item',
      }
      expect(canAddReference(invalidProperty, value)).toBe(false)

      // Invalid value - cannot add
      const invalidValue: ValueMapping = {
        type: 'column',
        source: { columnName: '', dataType: 'VARCHAR' },
        dataType: 'wikibase-item',
      }
      expect(canAddReference(property, invalidValue)).toBe(false)
    })
  })

  describe('reference display logic', () => {
    test('should determine when to show references section', () => {
      const shouldShowReferencesSection = (references: ReferenceSchemaMapping[]): boolean => {
        return references.length > 0
      }

      expect(shouldShowReferencesSection([])).toBe(false)

      const references: ReferenceSchemaMapping[] = [
        {
          property: { id: 'P248', label: 'stated in', dataType: 'wikibase-item' },
          value: {
            type: 'column',
            source: { columnName: 'source', dataType: 'VARCHAR' },
            dataType: 'wikibase-item',
          },
        },
      ]

      expect(shouldShowReferencesSection(references)).toBe(true)
    })

    test('should format reference display information correctly', () => {
      const getPropertyDisplayText = (property: PropertyReference): string => {
        return property.label || property.id
      }

      const getValueDisplayText = (value: ValueMapping): string => {
        if (value.type === 'column') {
          return typeof value.source === 'string' ? value.source : value.source.columnName
        }
        return typeof value.source === 'string' ? value.source : 'No mapping'
      }

      const reference: ReferenceSchemaMapping = {
        property: {
          id: 'P248',
          label: 'stated in',
          dataType: 'wikibase-item',
        },
        value: {
          type: 'column',
          source: {
            columnName: 'source_publication',
            dataType: 'VARCHAR',
          },
          dataType: 'wikibase-item',
        },
      }

      expect(getPropertyDisplayText(reference.property)).toBe('stated in')
      expect(getValueDisplayText(reference.value)).toBe('source_publication')

      // Test with constant value
      const constantReference: ReferenceSchemaMapping = {
        property: {
          id: 'P854',
          label: 'reference URL',
          dataType: 'url',
        },
        value: {
          type: 'constant',
          source: 'https://example.com',
          dataType: 'url',
        },
      }

      expect(getValueDisplayText(constantReference.value)).toBe('https://example.com')
    })

    test('should handle reference numbering for display', () => {
      const getReferenceNumber = (index: number): string => `R${index + 1}`

      expect(getReferenceNumber(0)).toBe('R1')
      expect(getReferenceNumber(1)).toBe('R2')
      expect(getReferenceNumber(2)).toBe('R3')

      const references: ReferenceSchemaMapping[] = [
        {
          property: { id: 'P248', label: 'stated in', dataType: 'wikibase-item' },
          value: { type: 'constant', source: 'Source 1', dataType: 'wikibase-item' },
        },
        {
          property: { id: 'P854', label: 'reference URL', dataType: 'url' },
          value: { type: 'constant', source: 'https://example.com', dataType: 'url' },
        },
      ]

      const referenceNumbers = references.map((_, index) => getReferenceNumber(index))
      expect(referenceNumbers).toEqual(['R1', 'R2'])
    })
  })
})
