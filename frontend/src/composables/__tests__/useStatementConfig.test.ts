import { describe, it, expect, beforeEach } from 'bun:test'
import { createPinia, setActivePinia } from 'pinia'
import { useStatementConfig } from '@frontend/composables/useStatementConfig'
import { useSchemaStore } from '@frontend/stores/schema.store'
import type {
  PropertyReference,
  ValueMapping,
  StatementRank,
} from '@frontend/types/wikibase-schema'

describe('useStatementConfig', () => {
  beforeEach(() => {
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia())
  })

  it('should initialize with default values', () => {
    const {
      currentStatement,
      valueTypes,
      dataTypes,
      rankOptions,
      canSaveStatement,
      sourceLabel,
      sourcePlaceholder,
      sourceValue,
    } = useStatementConfig()

    expect(currentStatement.value.property.id).toBe('P1')
    expect(currentStatement.value.property.label).toBe('')
    expect(currentStatement.value.property.dataType).toBe('string')
    expect(currentStatement.value.value.type).toBe('column')
    expect(currentStatement.value.value.source).toBe('')
    expect(currentStatement.value.value.dataType).toBe('string')
    expect(currentStatement.value.rank).toBe('normal')
    expect(canSaveStatement.value).toBe(false)
    expect(sourceLabel.value).toBe('Column Name')
    expect(sourcePlaceholder.value).toBe('column_name')
    expect(sourceValue.value).toBe('')
    expect(valueTypes).toHaveLength(3)
    expect(dataTypes).toHaveLength(7)
    expect(rankOptions).toHaveLength(3)
  })

  it('should validate statement correctly', () => {
    const { currentStatement, canSaveStatement, sourceValue } = useStatementConfig()

    // Initially invalid
    expect(canSaveStatement.value).toBe(false)

    // Set property ID
    currentStatement.value.property.id = 'P123' as `P${number}`
    expect(canSaveStatement.value).toBe(false)

    // Set source value
    sourceValue.value = 'test_column'
    expect(canSaveStatement.value).toBe(true)

    // Invalid property ID
    currentStatement.value.property.id = 'invalid' as `P${number}`
    expect(canSaveStatement.value).toBe(false)

    // Reset to valid property ID
    currentStatement.value.property.id = 'P456' as `P${number}`
    expect(canSaveStatement.value).toBe(true)

    // Empty source
    sourceValue.value = ''
    expect(canSaveStatement.value).toBe(false)

    // Whitespace only source
    sourceValue.value = '   '
    expect(canSaveStatement.value).toBe(false)
  })

  it('should update source label and placeholder based on value type', () => {
    const { currentStatement, sourceLabel, sourcePlaceholder } = useStatementConfig()

    // Column type
    currentStatement.value.value.type = 'column'
    expect(sourceLabel.value).toBe('Column Name')
    expect(sourcePlaceholder.value).toBe('column_name')

    // Constant type
    currentStatement.value.value.type = 'constant'
    expect(sourceLabel.value).toBe('Constant Value')
    expect(sourcePlaceholder.value).toBe('constant value')

    // Expression type
    currentStatement.value.value.type = 'expression'
    expect(sourceLabel.value).toBe('Expression')
    expect(sourcePlaceholder.value).toBe('expression')
  })

  it('should handle source value correctly', () => {
    const { currentStatement, sourceValue } = useStatementConfig()

    // Set string source
    sourceValue.value = 'test_value'
    expect(currentStatement.value.value.source).toBe('test_value')
    expect(sourceValue.value).toBe('test_value')

    // Clear source
    sourceValue.value = ''
    expect(currentStatement.value.value.source).toBe('')
    expect(sourceValue.value).toBe('')
  })

  it('should reset statement to default values', () => {
    const { currentStatement, resetStatement, sourceValue } = useStatementConfig()

    // Modify values
    currentStatement.value.property.id = 'P999' as `P${number}`
    currentStatement.value.property.label = 'Test Property'
    currentStatement.value.property.dataType = 'number'
    sourceValue.value = 'test_source'
    currentStatement.value.value.dataType = 'string'
    currentStatement.value.rank = 'preferred'

    // Reset statement
    resetStatement()

    // Check all values are reset
    expect(currentStatement.value.property.id).toBe('P1')
    expect(currentStatement.value.property.label).toBe('')
    expect(currentStatement.value.property.dataType).toBe('string')
    expect(currentStatement.value.value.type).toBe('column')
    expect(currentStatement.value.value.source).toBe('')
    expect(currentStatement.value.value.dataType).toBe('string')
    expect(currentStatement.value.rank).toBe('normal')
  })

  it('should auto-save statement when complete', async () => {
    // Create a mock implementation for addStatement
    let addedProperty: PropertyReference | null = null
    let addedValueMapping: ValueMapping | null = null
    let addedRank: StatementRank | null = null

    // Get the store and replace the addStatement method
    const store = useSchemaStore()
    const originalAddStatement = store.addStatement
    store.addStatement = (property, valueMapping, rank = 'normal') => {
      addedProperty = property
      addedValueMapping = valueMapping
      addedRank = rank
      return originalAddStatement(property, valueMapping, rank)
    }

    // Initialize the composable
    const { currentStatement, sourceValue, canSaveStatement } = useStatementConfig()

    // Initially should not be able to save
    expect(canSaveStatement.value).toBe(false)

    // Set up valid statement data
    currentStatement.value.property.id = 'P123' as `P${number}`
    currentStatement.value.property.label = 'Test Property'
    currentStatement.value.property.dataType = 'string'
    sourceValue.value = 'test_column'
    currentStatement.value.value.dataType = 'string'
    currentStatement.value.rank = 'preferred'

    // Test column type (should create object source)
    currentStatement.value.value.type = 'column'

    // Wait for auto-save to trigger
    await new Promise((resolve) => setTimeout(resolve, 0))

    // Verify the arguments passed to addStatement
    expect(addedProperty).toEqual({
      id: 'P123',
      label: 'Test Property',
      dataType: 'string',
    })

    expect(addedValueMapping).toEqual({
      type: 'column',
      source: {
        columnName: 'test_column',
        dataType: 'string',
      },
      dataType: 'string',
    })

    expect(addedRank).toBe('preferred')

    // Restore original method
    store.addStatement = originalAddStatement
  })

  it('should not auto-save when statement is invalid', async () => {
    // Create a flag to track if addStatement was called
    let addStatementCalled = false

    // Get the store and replace the addStatement method
    const store = useSchemaStore()
    const originalAddStatement = store.addStatement
    store.addStatement = (property, valueMapping, rank) => {
      addStatementCalled = true
      return originalAddStatement(property, valueMapping, rank)
    }

    // Initialize the composable
    const { currentStatement, sourceValue, canSaveStatement } = useStatementConfig()

    // Should not be able to save initially
    expect(canSaveStatement.value).toBe(false)

    // Wait to ensure no auto-save happens
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(addStatementCalled).toBe(false)

    // Set only property ID (still incomplete)
    currentStatement.value.property.id = 'P123' as `P${number}`
    expect(canSaveStatement.value).toBe(false)

    // Wait to ensure no auto-save happens
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(addStatementCalled).toBe(false)

    // Restore original method
    store.addStatement = originalAddStatement
  })

  it('should manually save current statement', () => {
    // Create a mock implementation for addStatement
    let addedProperty: PropertyReference | null = null
    let addedValueMapping: ValueMapping | null = null
    let addedRank: StatementRank | null = null

    // Get the store and replace the addStatement method
    const store = useSchemaStore()
    const originalAddStatement = store.addStatement
    store.addStatement = (property, valueMapping, rank = 'normal') => {
      addedProperty = property
      addedValueMapping = valueMapping
      addedRank = rank
      return originalAddStatement(property, valueMapping, rank)
    }

    // Initialize the composable
    const { currentStatement, sourceValue, saveCurrentStatement } = useStatementConfig()

    // Set up valid statement data
    currentStatement.value.property.id = 'P123' as `P${number}`
    currentStatement.value.property.label = 'Test Property'
    currentStatement.value.property.dataType = 'string'
    sourceValue.value = 'test_column'
    currentStatement.value.value.dataType = 'string'
    currentStatement.value.rank = 'preferred'
    currentStatement.value.value.type = 'column'

    // Manually save the statement
    saveCurrentStatement()

    // Verify the arguments passed to addStatement
    expect(addedProperty).toEqual({
      id: 'P123',
      label: 'Test Property',
      dataType: 'string',
    })

    expect(addedValueMapping).toEqual({
      type: 'column',
      source: {
        columnName: 'test_column',
        dataType: 'string',
      },
      dataType: 'string',
    })

    expect(addedRank).toBe('preferred')

    // Restore original method
    store.addStatement = originalAddStatement
  })
})
