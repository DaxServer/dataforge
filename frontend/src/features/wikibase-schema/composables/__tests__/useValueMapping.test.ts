import type { PropertyReference } from '@backend/api/project/project.wikibase'
import type { WikibaseDataType } from '@backend/types/wikibase-schema'
import { useValueMapping } from '@frontend/features/wikibase-schema/composables/useValueMapping'
import type { ColumnInfo } from '@frontend/shared/types/wikibase-schema'
import { beforeEach, describe, expect, test } from 'bun:test'

describe('useValueMapping', () => {
  let testColumns: ColumnInfo[]
  let testProperty: PropertyReference

  beforeEach(() => {
    testColumns = [
      {
        name: 'name',
        dataType: 'VARCHAR',
        sampleValues: ['John Doe', 'Jane Smith'],
        nullable: false,
        uniqueCount: 100,
      },
      {
        name: 'birth_date',
        dataType: 'DATE',
        sampleValues: ['1990-01-01', '1985-05-15'],
        nullable: true,
        uniqueCount: 95,
      },
      {
        name: 'population',
        dataType: 'INTEGER',
        sampleValues: ['1000000', '500000'],
        nullable: false,
        uniqueCount: 50,
      },
    ]

    testProperty = {
      id: 'P31',
      label: 'instance of',
      dataType: 'wikibase-item',
    }
  })

  describe('Value Mapping Creation', () => {
    test('should create column value mapping from column info', () => {
      const { createValueMappingFromColumn } = useValueMapping()

      const firstColumn = testColumns[0]
      expect(firstColumn).toBeDefined()
      const mapping = createValueMappingFromColumn(firstColumn!)

      expect(mapping.type).toBe('column')
      expect(mapping.source).toEqual({
        columnName: 'name',
        dataType: 'VARCHAR',
      })
      expect(mapping.dataType).toBe('string') // First compatible type
    })

    test('should create column value mapping with specific target data type', () => {
      const { createValueMappingFromColumn } = useValueMapping()

      // Test with URL which should be compatible with VARCHAR
      const firstColumn = testColumns[0]
      expect(firstColumn).toBeDefined()
      const mapping = createValueMappingFromColumn(firstColumn!, 'url')

      expect(mapping.type).toBe('column')
      expect(mapping.dataType).toBe('url')
    })

    test('should create constant value mapping', () => {
      const { createConstantMapping } = useValueMapping()

      const mapping = createConstantMapping('Q5', 'wikibase-item')

      expect(mapping.type).toBe('constant')
      expect(mapping.source).toBe('Q5')
      expect(mapping.dataType).toBe('wikibase-item')
    })

    test('should create expression value mapping', () => {
      const { createExpressionMapping } = useValueMapping()

      const mapping = createExpressionMapping('CONCAT(first_name, " ", last_name)', 'string')

      expect(mapping.type).toBe('expression')
      expect(mapping.source).toBe('CONCAT(first_name, " ", last_name)')
      expect(mapping.dataType).toBe('string')
    })
  })

  describe('Value Type Management', () => {
    test('should update value type and reset source', () => {
      const { currentMapping, updateValueType } = useValueMapping()

      // Start with column type
      expect(currentMapping.value.type).toBe('column')

      // Change to constant
      updateValueType('constant')
      expect(currentMapping.value.type).toBe('constant')
      expect(currentMapping.value.source).toBe('')

      // Change to expression
      updateValueType('expression')
      expect(currentMapping.value.type).toBe('expression')
      expect(currentMapping.value.source).toBe('')

      // Change back to column
      updateValueType('column')
      expect(currentMapping.value.type).toBe('column')
      expect(currentMapping.value.source).toEqual({
        columnName: '',
        dataType: 'VARCHAR',
      })
    })
  })

  describe('Column Source Management', () => {
    test('should update column source and auto-suggest data type', () => {
      const { currentMapping, updateColumnSource } = useValueMapping()

      const secondColumn = testColumns[1]
      expect(secondColumn).toBeDefined()
      updateColumnSource(secondColumn!)

      expect(currentMapping.value.source).toEqual({
        columnName: 'birth_date',
        dataType: 'DATE',
      })
      expect(currentMapping.value.dataType).toBe('time')
    })

    test('should not update source if not column type', () => {
      const { currentMapping, updateValueType, updateColumnSource } = useValueMapping()

      updateValueType('constant')
      const originalSource = currentMapping.value.source

      const firstColumn = testColumns[0]
      expect(firstColumn).toBeDefined()
      updateColumnSource(firstColumn!)

      expect(currentMapping.value.source).toBe(originalSource) // Should not change
    })
  })

  describe('Data Type Management', () => {
    test('should get compatible data types for column', () => {
      const { getCompatibleDataTypes } = useValueMapping()

      const compatibleTypes = getCompatibleDataTypes('VARCHAR')
      const compatibleValues = compatibleTypes.map((t) => t.value)

      expect(compatibleTypes.length).toBeGreaterThan(0)
      expect(compatibleValues).toContain('string')
    })

    test('should return all data types when no column type provided', () => {
      const { getCompatibleDataTypes, wikibaseDataTypes } = useValueMapping()

      const allTypes = getCompatibleDataTypes()

      expect(allTypes.length).toBe(wikibaseDataTypes.length)
    })

    test('should auto-suggest data type based on property and column', () => {
      const { autoSuggestDataType } = useValueMapping()

      // Compatible property and column
      const stringProperty: PropertyReference = {
        id: 'P1476',
        label: 'title',
        dataType: 'string',
      }

      const suggestedType = autoSuggestDataType(stringProperty, testColumns[0])
      expect(suggestedType).toBe('string')

      // Incompatible property and column
      const quantityProperty: PropertyReference = {
        id: 'P2043',
        label: 'length',
        dataType: 'quantity',
      }

      const fallbackType = autoSuggestDataType(quantityProperty, testColumns[0])
      expect(fallbackType).toBe('string') // Falls back to first compatible
    })

    test('should use property data type when no column provided', () => {
      const { autoSuggestDataType } = useValueMapping()

      const suggestedType = autoSuggestDataType(testProperty)
      expect(suggestedType).toBe('wikibase-item')
    })
  })

  describe('Validation', () => {
    test('should validate column mapping', () => {
      const { validateMapping } = useValueMapping()

      // Valid column mapping
      const validMapping = {
        type: 'column' as const,
        source: {
          columnName: 'name',
          dataType: 'VARCHAR',
        },
        dataType: 'string' as WikibaseDataType,
      }

      const validResult = validateMapping(validMapping)
      expect(validResult.isValid).toBe(true)
      expect(validResult.errors).toEqual([])

      // Invalid column mapping - missing column name
      const invalidMapping = {
        type: 'column' as const,
        source: {
          columnName: '',
          dataType: 'VARCHAR',
        },
        dataType: 'string' as WikibaseDataType,
      }

      const invalidResult = validateMapping(invalidMapping)
      expect(invalidResult.isValid).toBe(false)
      expect(invalidResult.errors).toContain('Column name is required')
    })

    test('should validate constant mapping', () => {
      const { validateMapping } = useValueMapping()

      // Valid constant mapping
      const validMapping = {
        type: 'constant' as const,
        source: 'Q5',
        dataType: 'wikibase-item' as WikibaseDataType,
      }

      const validResult = validateMapping(validMapping)
      expect(validResult.isValid).toBe(true)

      // Invalid constant mapping - empty source
      const invalidMapping = {
        type: 'constant' as const,
        source: '',
        dataType: 'wikibase-item' as WikibaseDataType,
      }

      const invalidResult = validateMapping(invalidMapping)
      expect(invalidResult.isValid).toBe(false)
      expect(invalidResult.errors).toContain('Value source is required')
    })

    test('should validate data type compatibility', () => {
      const { validateMapping } = useValueMapping()

      // Incompatible column and data type
      const incompatibleMapping = {
        type: 'column' as const,
        source: {
          columnName: 'population',
          dataType: 'INTEGER',
        },
        dataType: 'string' as WikibaseDataType, // INTEGER is not compatible with string
      }

      const result = validateMapping(incompatibleMapping)
      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.includes('not compatible'))).toBe(true)
    })
  })

  describe('State Management', () => {
    test('should track current mapping state', () => {
      const { isColumnType, isConstantType, isExpressionType } = useValueMapping()

      // Initial state should be column type
      expect(isColumnType.value).toBe(true)
      expect(isConstantType.value).toBe(false)
      expect(isExpressionType.value).toBe(false)
    })

    test('should track validity of current mapping', () => {
      const { isValidMapping, updateColumnSource } = useValueMapping()

      // Initially invalid (no column selected)
      expect(isValidMapping.value).toBe(false)

      // Should be valid after selecting column
      const firstColumn = testColumns[0]
      expect(firstColumn).toBeDefined()
      updateColumnSource(firstColumn!)
      expect(isValidMapping.value).toBe(true)
    })

    test('should reset mapping to default state', () => {
      const { currentMapping, updateValueType, resetMapping } = useValueMapping()

      // Change state
      updateValueType('constant')

      // Reset
      resetMapping()

      expect(currentMapping.value.type).toBe('column')
      expect(currentMapping.value.dataType).toBe('string')
      expect(currentMapping.value.source).toEqual({
        columnName: '',
        dataType: 'VARCHAR',
      })
    })
  })
})
