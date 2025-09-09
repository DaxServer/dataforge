import type { PropertyReference, ValueMapping } from '@backend/api/project/project.wikibase'
import type { StatementRank, WikibaseDataType } from '@backend/types/wikibase-schema'
import { useStatementEditor } from '@frontend/features/wikibase-schema/composables/useStatementEditor'
import type { ColumnInfo } from '@frontend/shared/types/wikibase-schema'
import { beforeEach, describe, expect, test } from 'bun:test'

describe('useStatementEditor', () => {
  let testColumns: ColumnInfo[]
  let testProperty: PropertyReference
  let initialStatement: {
    property: PropertyReference | null
    value: ValueMapping
    rank: StatementRank
  }

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

    initialStatement = {
      property: testProperty,
      value: {
        type: 'column',
        source: {
          columnName: 'name',
          dataType: 'VARCHAR',
        },
        dataType: 'string',
      },
      rank: 'normal',
    }
  })

  describe('Initialization', () => {
    test('should initialize with default statement', () => {
      const { localStatement } = useStatementEditor()

      expect(localStatement.value.property).toBeNull()
      expect(localStatement.value.value.type).toBe('column')
      expect(localStatement.value.value.dataType).toBe('string')
      expect(localStatement.value.rank).toBe('normal')
    })

    test('should initialize with provided statement data', () => {
      const { localStatement, initializeStatement } = useStatementEditor()

      initializeStatement(initialStatement)

      expect(localStatement.value.property).toEqual(testProperty)
      expect(localStatement.value.value.type).toBe('column')
      expect(localStatement.value.value.dataType).toBe('string')
      expect(localStatement.value.rank).toBe('normal')
    })

    test('should set available columns', () => {
      const { setAvailableColumns } = useStatementEditor()

      // Should not throw when setting available columns
      expect(() => setAvailableColumns(testColumns)).not.toThrow()
    })
  })

  describe('Configuration Options', () => {
    test('should provide value type options', () => {
      const { valueTypeOptions } = useStatementEditor()

      expect(valueTypeOptions).toHaveLength(3)
      expect(valueTypeOptions.map((o) => o.value)).toEqual(['column', 'constant', 'expression'])
    })

    test('should provide rank options', () => {
      const { rankOptions } = useStatementEditor()

      expect(rankOptions).toHaveLength(3)
      expect(rankOptions.map((o) => o.value)).toEqual(['preferred', 'normal', 'deprecated'])
    })

    test('should provide wikibase data types', () => {
      const { wikibaseDataTypes } = useStatementEditor()

      expect(wikibaseDataTypes.length).toBeGreaterThan(0)
      expect(wikibaseDataTypes.some((t) => t.value === 'string')).toBe(true)
      expect(wikibaseDataTypes.some((t) => t.value === 'wikibase-item')).toBe(true)
    })
  })

  describe('Computed Properties', () => {
    test('should detect value type correctly', () => {
      const { isColumnType, isConstantType, isExpressionType } = useStatementEditor()

      expect(isColumnType.value).toBe(true)
      expect(isConstantType.value).toBe(false)
      expect(isExpressionType.value).toBe(false)
    })

    test('should provide correct source labels and placeholders', () => {
      const { sourceLabel, sourcePlaceholder } = useStatementEditor()

      expect(sourceLabel.value).toBe('Column')
      expect(sourcePlaceholder.value).toBe('Select a column...')
    })

    test('should provide source value for column type', () => {
      const { localStatement, sourceValue } = useStatementEditor()

      // Set column source
      localStatement.value.value.source = {
        columnName: 'name',
        dataType: 'VARCHAR',
      }

      expect(sourceValue.value).toBe('name')
    })

    test('should validate statement correctly', () => {
      const { localStatement, isValidStatement, handlePropertyUpdate, setAvailableColumns } =
        useStatementEditor()

      setAvailableColumns(testColumns)

      // Initially invalid (no property)
      expect(isValidStatement.value).toBe(false)

      // Should be valid after setting property and source
      handlePropertyUpdate(testProperty)
      localStatement.value.value.source = {
        columnName: 'name',
        dataType: 'VARCHAR',
      }
      expect(isValidStatement.value).toBe(true)
    })

    test('should filter compatible data types for column type', () => {
      const { localStatement, compatibleDataTypes, setAvailableColumns } = useStatementEditor()

      setAvailableColumns(testColumns)

      // Set column source
      localStatement.value.value.source = {
        columnName: 'name',
        dataType: 'VARCHAR',
      }

      const compatibleValues = compatibleDataTypes.value.map((t) => t.value)
      expect(compatibleValues).toContain('string')
      expect(compatibleValues).toContain('url')
    })

    test('should provide data type validation message', () => {
      const { localStatement, dataTypeValidationMessage } = useStatementEditor()

      // Set incompatible types
      localStatement.value.value.source = {
        columnName: 'population',
        dataType: 'INTEGER',
      }
      localStatement.value.value.dataType = 'string'

      expect(dataTypeValidationMessage.value).toContain('not compatible')
    })
  })

  describe('Event Handlers', () => {
    test('should handle property update', () => {
      const { localStatement, handlePropertyUpdate } = useStatementEditor()

      handlePropertyUpdate(testProperty)

      expect(localStatement.value.property).toEqual(testProperty)
      expect(localStatement.value.value.dataType).toBe('wikibase-item')
    })

    test('should handle value type change', () => {
      const { localStatement, handleValueTypeChange } = useStatementEditor()

      handleValueTypeChange('constant')

      expect(localStatement.value.value.type).toBe('constant')
      expect(localStatement.value.value.source).toBe('')
    })

    test('should handle rank change', () => {
      const { localStatement, handleRankChange } = useStatementEditor()

      handleRankChange('preferred')

      expect(localStatement.value.rank).toBe('preferred')
    })

    test('should handle column drop', () => {
      const { localStatement, handleColumnDrop } = useStatementEditor()

      const dateColumn = testColumns[1]!
      handleColumnDrop(dateColumn)

      expect(localStatement.value.value.type).toBe('column')
      expect(localStatement.value.value.source).toHaveProperty('columnName', 'birth_date')
      expect(localStatement.value.value.dataType).toBe('time')
    })
  })

  describe('Source Value Management', () => {
    test('should handle source value for column type', () => {
      const { localStatement, sourceValue } = useStatementEditor()

      // Set column source
      localStatement.value.value.source = {
        columnName: 'name',
        dataType: 'VARCHAR',
      }

      expect(sourceValue.value).toBe('name')
    })

    test('should handle source value for constant type', () => {
      const { localStatement, sourceValue, handleValueTypeChange } = useStatementEditor()

      handleValueTypeChange('constant')
      sourceValue.value = 'Q5'

      expect(sourceValue.value).toBe('Q5')
      expect(localStatement.value.value.source).toBe('Q5')
    })

    test('should not allow setting source value for column type', () => {
      const { localStatement, sourceValue } = useStatementEditor()

      // Set initial column source
      localStatement.value.value.source = {
        columnName: 'name',
        dataType: 'VARCHAR',
      }

      // Try to set source value (should be ignored for column type)
      sourceValue.value = 'different_name'

      // Should still return the original column name
      expect(sourceValue.value).toBe('name')
    })
  })

  describe('Statement Management', () => {
    test('should update statement from external changes', () => {
      const { localStatement, initializeStatement } = useStatementEditor()

      const newStatement = {
        property: testProperty,
        value: {
          type: 'constant' as const,
          source: 'Q5' as string,
          dataType: 'wikibase-item' as WikibaseDataType,
        } as ValueMapping,
        rank: 'preferred' as StatementRank,
      }

      initializeStatement(newStatement)

      expect(localStatement.value.property).toEqual(testProperty)
      expect(localStatement.value.value.type).toBe('constant')
      expect(localStatement.value.value.source).toBe('Q5')
      expect(localStatement.value.rank).toBe('preferred')
    })

    test('should reset statement to default', () => {
      const { localStatement, resetStatement, handlePropertyUpdate } = useStatementEditor()

      // Make changes
      handlePropertyUpdate(testProperty)

      // Reset
      resetStatement()

      expect(localStatement.value.property).toBeNull()
      expect(localStatement.value.value.type).toBe('column')
      expect(localStatement.value.rank).toBe('normal')
    })

    test('should get current statement value', () => {
      const { getStatement, handlePropertyUpdate } = useStatementEditor()

      handlePropertyUpdate(testProperty)
      const statement = getStatement()

      expect(statement.property).toEqual(testProperty)
      expect(statement.value.type).toBe('column')
      expect(statement.rank).toBe('normal')
    })
  })
})
