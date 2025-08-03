import { describe, test, expect, beforeEach } from 'bun:test'
import type {
  PropertyReference,
  ValueMapping,
  WikibaseDataType,
} from '@frontend/shared/types/wikibase-schema'
import { useStatementDataTypeValidation } from '@frontend/features/wikibase-schema/composables/useStatementDataTypeValidation'

describe('useStatementDataTypeValidation', () => {
  let testProperties: PropertyReference[]

  beforeEach(() => {
    testProperties = [
      { id: 'P31', label: 'instance of', dataType: 'wikibase-item' },
      { id: 'P1476', label: 'title', dataType: 'string' },
      { id: 'P569', label: 'date of birth', dataType: 'time' },
      { id: 'P1082', label: 'population', dataType: 'quantity' },
      { id: 'P856', label: 'official website', dataType: 'url' },
    ]
  })

  describe('validateStatementDataType', () => {
    test('should validate compatible VARCHAR column with string property', () => {
      const { validateStatementDataType } = useStatementDataTypeValidation()

      const valueMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'title', dataType: 'VARCHAR' },
        dataType: 'string',
      }

      const property = testProperties.find((p) => p.id === 'P1476')!
      const result = validateStatementDataType(valueMapping, property, 'statements[0].value')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should validate compatible INTEGER column with quantity property', () => {
      const { validateStatementDataType } = useStatementDataTypeValidation()

      const valueMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'population', dataType: 'INTEGER' },
        dataType: 'quantity',
      }

      const property = testProperties.find((p) => p.id === 'P1082')!
      const result = validateStatementDataType(valueMapping, property, 'statements[0].value')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should validate compatible DATE column with time property', () => {
      const { validateStatementDataType } = useStatementDataTypeValidation()

      const valueMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'birth_date', dataType: 'DATE' },
        dataType: 'time',
      }

      const property = testProperties.find((p) => p.id === 'P569')!
      const result = validateStatementDataType(valueMapping, property, 'statements[0].value')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should detect incompatible INTEGER column with string property', () => {
      const { validateStatementDataType } = useStatementDataTypeValidation()

      const valueMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'population', dataType: 'INTEGER' },
        dataType: 'string',
      }

      const property = testProperties.find((p) => p.id === 'P1476')!
      const result = validateStatementDataType(valueMapping, property, 'statements[0].value')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.code).toBe('INCOMPATIBLE_DATA_TYPE')
      expect(result.errors[0]?.context?.columnName).toBe('population')
      expect(result.errors[0]?.context?.dataType).toBe('INTEGER')
      expect(result.errors[0]?.context?.targetType).toBe('string')
    })

    test('should detect incompatible VARCHAR column with quantity property', () => {
      const { validateStatementDataType } = useStatementDataTypeValidation()

      const valueMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'title', dataType: 'VARCHAR' },
        dataType: 'quantity',
      }

      const property = testProperties.find((p) => p.id === 'P1082')!
      const result = validateStatementDataType(valueMapping, property, 'statements[0].value')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.code).toBe('INCOMPATIBLE_DATA_TYPE')
    })

    test('should detect incompatible BOOLEAN column with time property', () => {
      const { validateStatementDataType } = useStatementDataTypeValidation()

      const valueMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'active', dataType: 'BOOLEAN' },
        dataType: 'time',
      }

      const property = testProperties.find((p) => p.id === 'P569')!
      const result = validateStatementDataType(valueMapping, property, 'statements[0].value')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.code).toBe('INCOMPATIBLE_DATA_TYPE')
    })

    test('should validate constant values without column compatibility check', () => {
      const { validateStatementDataType } = useStatementDataTypeValidation()

      const valueMapping: ValueMapping = {
        type: 'constant',
        source: 'Q5',
        dataType: 'wikibase-item',
      }

      const property = testProperties.find((p) => p.id === 'P31')!
      const result = validateStatementDataType(valueMapping, property, 'statements[0].value')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should validate expression values without column compatibility check', () => {
      const { validateStatementDataType } = useStatementDataTypeValidation()

      const valueMapping: ValueMapping = {
        type: 'expression',
        source: 'CONCAT("https://example.com/", id)',
        dataType: 'url',
      }

      const property = testProperties.find((p) => p.id === 'P856')!
      const result = validateStatementDataType(valueMapping, property, 'statements[0].value')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should handle missing property gracefully', () => {
      const { validateStatementDataType } = useStatementDataTypeValidation()

      const valueMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'title', dataType: 'VARCHAR' },
        dataType: 'string',
      }

      const result = validateStatementDataType(valueMapping, null, 'statements[0].value')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.code).toBe('INVALID_PROPERTY_ID')
    })

    test('should handle missing column source gracefully', () => {
      const { validateStatementDataType } = useStatementDataTypeValidation()

      const valueMapping: ValueMapping = {
        type: 'column',
        source: { columnName: '', dataType: 'VARCHAR' },
        dataType: 'string',
      }

      const property = testProperties.find((p) => p.id === 'P1476')!
      const result = validateStatementDataType(valueMapping, property, 'statements[0].value')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.code).toBe('MISSING_STATEMENT_VALUE')
    })
  })

  describe('getCompatibilityWarnings', () => {
    test('should provide warnings for suboptimal but valid mappings', () => {
      const { getCompatibilityWarnings } = useStatementDataTypeValidation()

      const valueMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'title', dataType: 'VARCHAR' },
        dataType: 'external-id',
      }

      const property: PropertyReference = { id: 'P213', label: 'ISNI', dataType: 'external-id' }
      const warnings = getCompatibilityWarnings(valueMapping, property, 'statements[0].value')

      expect(warnings).toHaveLength(1)
      expect(warnings[0]?.type).toBe('warning')
      expect(warnings[0]?.code).toBe('INCOMPATIBLE_DATA_TYPE')
      expect(warnings[0]?.message).toContain('may not be optimal')
    })

    test('should not provide warnings for optimal mappings', () => {
      const { getCompatibilityWarnings } = useStatementDataTypeValidation()

      const valueMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'title', dataType: 'VARCHAR' },
        dataType: 'string',
      }

      const property = testProperties.find((p) => p.id === 'P1476')!
      const warnings = getCompatibilityWarnings(valueMapping, property, 'statements[0].value')

      expect(warnings).toHaveLength(0)
    })

    test('should not provide warnings for non-column types', () => {
      const { getCompatibilityWarnings } = useStatementDataTypeValidation()

      const valueMapping: ValueMapping = {
        type: 'constant',
        source: 'Q5',
        dataType: 'wikibase-item',
      }

      const property = testProperties.find((p) => p.id === 'P31')!
      const warnings = getCompatibilityWarnings(valueMapping, property, 'statements[0].value')

      expect(warnings).toHaveLength(0)
    })
  })

  describe('getSuggestedDataTypes', () => {
    test('should suggest compatible data types for VARCHAR column', () => {
      const { getSuggestedDataTypes } = useStatementDataTypeValidation()

      const suggestions = getSuggestedDataTypes('VARCHAR')

      expect(suggestions).toContain('string')
      expect(suggestions).toContain('url')
      expect(suggestions).toContain('external-id')
      expect(suggestions).toContain('monolingualtext')
      expect(suggestions).not.toContain('quantity')
      expect(suggestions).not.toContain('time')
    })

    test('should suggest compatible data types for INTEGER column', () => {
      const { getSuggestedDataTypes } = useStatementDataTypeValidation()

      const suggestions = getSuggestedDataTypes('INTEGER')

      expect(suggestions).toContain('quantity')
      expect(suggestions).not.toContain('string')
      expect(suggestions).not.toContain('time')
    })

    test('should suggest compatible data types for DATE column', () => {
      const { getSuggestedDataTypes } = useStatementDataTypeValidation()

      const suggestions = getSuggestedDataTypes('DATE')

      expect(suggestions).toContain('time')
      expect(suggestions).not.toContain('string')
      expect(suggestions).not.toContain('quantity')
    })

    test('should return empty array for unknown column type', () => {
      const { getSuggestedDataTypes } = useStatementDataTypeValidation()

      const suggestions = getSuggestedDataTypes('UNKNOWN_TYPE')

      expect(suggestions).toEqual([])
    })
  })

  describe('validateStatementValue', () => {
    test('should validate complete statement with valid mapping', () => {
      const { validateStatementValue } = useStatementDataTypeValidation()

      const statement = {
        property: testProperties.find((p) => p.id === 'P1476')!,
        value: {
          type: 'column' as const,
          source: { columnName: 'title', dataType: 'VARCHAR' },
          dataType: 'string' as WikibaseDataType,
        },
        rank: 'normal' as const,
      }

      const result = validateStatementValue(statement, 'statements[0]')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should validate complete statement with invalid mapping', () => {
      const { validateStatementValue } = useStatementDataTypeValidation()

      const statement = {
        property: testProperties.find((p) => p.id === 'P1476')!,
        value: {
          type: 'column' as const,
          source: { columnName: 'population', dataType: 'INTEGER' },
          dataType: 'string' as WikibaseDataType,
        },
        rank: 'normal' as const,
      }

      const result = validateStatementValue(statement, 'statements[0]')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.code).toBe('INCOMPATIBLE_DATA_TYPE')
    })

    test('should validate statement with missing property', () => {
      const { validateStatementValue } = useStatementDataTypeValidation()

      const statement = {
        property: null,
        value: {
          type: 'column' as const,
          source: { columnName: 'title', dataType: 'VARCHAR' },
          dataType: 'string' as WikibaseDataType,
        },
        rank: 'normal' as const,
      }

      const result = validateStatementValue(statement, 'statements[0]')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.code).toBe('INVALID_PROPERTY_ID')
    })
  })
})
