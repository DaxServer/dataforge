import { describe, it, expect, beforeEach } from 'bun:test'
import { createPinia, setActivePinia } from 'pinia'
import { useStatementConfig } from '@frontend/composables/useStatementConfig'
import { useSchemaStore } from '@frontend/stores/schema.store'
import { PropertyId } from '@backend/types/wikibase-schema'
import type { StatementRank } from '@frontend/types/wikibase-schema'

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

    expect(currentStatement.value.property).toBeNull()
    expect(currentStatement.value.value.type).toBe('column')
    expect(currentStatement.value.value.source).toEqual({ columnName: '', dataType: 'VARCHAR' })
    expect(currentStatement.value.value.dataType).toBe('string')
    expect(currentStatement.value.rank).toBe('normal' as StatementRank)
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

    // Initially invalid (no property)
    expect(canSaveStatement.value).toBe(false)

    // Set property
    currentStatement.value.property = {
      id: 'P123' as PropertyId,
      label: 'test property',
      dataType: 'string',
    }
    expect(canSaveStatement.value).toBe(false)

    // Set source value
    sourceValue.value = 'test_column'
    expect(canSaveStatement.value).toBe(true)

    // Invalid property ID
    currentStatement.value.property.id = 'invalid' as PropertyId
    expect(canSaveStatement.value).toBe(false)

    // Reset to valid property ID
    currentStatement.value.property.id = 'P456' as PropertyId
    expect(canSaveStatement.value).toBe(true)

    // Empty source
    sourceValue.value = ''
    expect(canSaveStatement.value).toBe(false)

    // Whitespace only source
    sourceValue.value = '   '
    expect(canSaveStatement.value).toBe(false)

    // Null property
    currentStatement.value.property = null
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
    currentStatement.value.property = {
      id: 'P999' as PropertyId,
      label: 'Test Property',
      dataType: 'string',
    }
    sourceValue.value = 'test_source'
    currentStatement.value.value.dataType = 'string'
    currentStatement.value.rank = 'preferred'

    // Reset statement
    resetStatement()

    // Check all values are reset
    expect(currentStatement.value.property).toBeNull()
    expect(currentStatement.value.value.type).toBe('column')
    expect(currentStatement.value.value.source).toEqual({ columnName: '', dataType: 'VARCHAR' })
    expect(currentStatement.value.value.dataType).toBe('string')
    // @ts-expect-error
    expect(currentStatement.value.rank).toBe('normal' as StatementRank)
  })

  it('should auto-save statement when complete', async () => {
    const store = useSchemaStore()
    const { currentStatement, sourceValue, canSaveStatement, resetStatement } = useStatementConfig()

    // Reset to ensure clean state
    resetStatement()

    // Initially should not be able to save
    expect(canSaveStatement.value).toBe(false)
    expect(store.statements).toHaveLength(0)

    // Set up valid statement data
    currentStatement.value.property = {
      id: 'P123' as PropertyId,
      label: 'Test Property',
      dataType: 'string',
    }
    sourceValue.value = 'test_column'
    currentStatement.value.value.dataType = 'string'
    currentStatement.value.rank = 'preferred'
    currentStatement.value.value.type = 'column'

    // Wait for auto-save to trigger
    await new Promise((resolve) => setTimeout(resolve, 0))

    // Verify statement was added to store
    expect(store.statements).toHaveLength(1)
    expect(store.statements[0]?.property.id).toBe('P123')
    expect(store.statements[0]?.property.label).toBe('Test Property')
    expect(store.statements[0]?.rank).toBe('preferred')
  })

  it('should not auto-save when statement is invalid', async () => {
    const store = useSchemaStore()
    const { currentStatement, canSaveStatement, resetStatement } = useStatementConfig()

    // Reset to ensure clean state
    resetStatement()

    // Should not be able to save initially
    expect(canSaveStatement.value).toBe(false)
    expect(store.statements).toHaveLength(0)

    // Wait to ensure no auto-save happens
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(store.statements).toHaveLength(0)

    // Set only property (still incomplete without source)
    currentStatement.value.property = {
      id: 'P123' as PropertyId,
      label: 'Test Property',
      dataType: 'string',
    }
    expect(canSaveStatement.value).toBe(false)

    // Wait to ensure no auto-save happens
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(store.statements).toHaveLength(0)
  })

  it('should manually save current statement', () => {
    const store = useSchemaStore()
    const { currentStatement, sourceValue, saveCurrentStatement } = useStatementConfig()

    // Initially no statements in store
    expect(store.statements).toHaveLength(0)

    // Set up valid statement data
    currentStatement.value.property = {
      id: 'P123' as PropertyId,
      label: 'Test Property',
      dataType: 'string',
    }
    sourceValue.value = 'test_column'
    currentStatement.value.value.dataType = 'string'
    currentStatement.value.rank = 'preferred'
    currentStatement.value.value.type = 'column'

    // Manually save the statement
    saveCurrentStatement()

    // Verify statement was added to store
    expect(store.statements).toHaveLength(1)
    expect(store.statements[0]?.property.id).toBe('P123')
    expect(store.statements[0]?.property.label).toBe('Test Property')
    expect(store.statements[0]?.rank).toBe('preferred')
    expect(store.statements[0]?.value.type).toBe('column')
  })
})
