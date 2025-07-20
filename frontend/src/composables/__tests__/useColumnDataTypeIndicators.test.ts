import { describe, test, expect } from 'bun:test'
import { useColumnDataTypeIndicators } from '@frontend/composables/useColumnDataTypeIndicators'
import type { ColumnInfo } from '@frontend/types/wikibase-schema'

describe('useColumnDataTypeIndicators', () => {
  const {
    formatDataTypeDisplayName,
    generateDataTypeTooltip,
    formatSampleValuesForTooltip,
    generateColumnTooltip,
    generateSampleStats,
    getDataTypeIcon,
    getDataTypeSeverity,
  } = useColumnDataTypeIndicators()

  describe('formatDataTypeDisplayName', () => {
    test('should format common data types correctly', () => {
      expect(formatDataTypeDisplayName('VARCHAR')).toBe('Text')
      expect(formatDataTypeDisplayName('INTEGER')).toBe('Number')
      expect(formatDataTypeDisplayName('DATE')).toBe('Date')
      expect(formatDataTypeDisplayName('DATETIME')).toBe('Date/Time')
      expect(formatDataTypeDisplayName('BOOLEAN')).toBe('Boolean')
    })

    test('should handle case insensitive input', () => {
      expect(formatDataTypeDisplayName('varchar')).toBe('Text')
      expect(formatDataTypeDisplayName('integer')).toBe('Number')
    })

    test('should return original type for unknown types', () => {
      expect(formatDataTypeDisplayName('UNKNOWN_TYPE')).toBe('UNKNOWN_TYPE')
      expect(formatDataTypeDisplayName('CUSTOM')).toBe('CUSTOM')
    })

    test('should handle numeric variations', () => {
      expect(formatDataTypeDisplayName('DECIMAL')).toBe('Decimal')
      expect(formatDataTypeDisplayName('FLOAT')).toBe('Decimal')
      expect(formatDataTypeDisplayName('NUMERIC')).toBe('Number')
    })
  })

  describe('generateDataTypeTooltip', () => {
    test('should generate tooltip for basic column', () => {
      const column: ColumnInfo = {
        name: 'test_column',
        dataType: 'VARCHAR',
        sampleValues: ['sample1', 'sample2'],
        nullable: false,
      }

      const tooltip = generateDataTypeTooltip(column)

      expect(tooltip).toContain('Data Type: Text (VARCHAR)')
      expect(tooltip).toContain('Wikibase Compatible: string, url, external-id, monolingualtext')
      expect(tooltip).not.toContain('Nullable: Yes')
    })

    test('should include nullable information when applicable', () => {
      const column: ColumnInfo = {
        name: 'nullable_column',
        dataType: 'INTEGER',
        sampleValues: ['1', '2'],
        nullable: true,
        uniqueCount: 100,
      }

      const tooltip = generateDataTypeTooltip(column)

      expect(tooltip).toContain('Data Type: Number (INTEGER)')
      expect(tooltip).toContain('Nullable: Yes')
      expect(tooltip).toContain('Unique Values: 100')
      expect(tooltip).toContain('Wikibase Compatible: quantity')
    })

    test('should handle incompatible data types', () => {
      const column: ColumnInfo = {
        name: 'boolean_column',
        dataType: 'BOOLEAN',
        sampleValues: ['true', 'false'],
        nullable: false,
      }

      const tooltip = generateDataTypeTooltip(column)

      expect(tooltip).toContain('Data Type: Boolean (BOOLEAN)')
      expect(tooltip).toContain('Wikibase Compatible: None (requires transformation)')
    })

    test('should format unique count with locale formatting', () => {
      const column: ColumnInfo = {
        name: 'large_column',
        dataType: 'VARCHAR',
        sampleValues: ['test'],
        nullable: false,
        uniqueCount: 1234567,
      }

      const tooltip = generateDataTypeTooltip(column)

      expect(tooltip).toContain('Unique Values: 1,234,567')
    })
  })

  describe('formatSampleValuesForTooltip', () => {
    test('should format sample values with default limit', () => {
      const values = ['val1', 'val2', 'val3', 'val4', 'val5', 'val6']
      const result = formatSampleValuesForTooltip(values)

      expect(result).toBe('val1, val2, val3, val4, val5, ... (+1 more)')
    })

    test('should handle fewer values than limit', () => {
      const values = ['val1', 'val2', 'val3']
      const result = formatSampleValuesForTooltip(values)

      expect(result).toBe('val1, val2, val3')
    })

    test('should handle empty sample values', () => {
      const values: string[] = []
      const result = formatSampleValuesForTooltip(values)

      expect(result).toBe('No sample data available')
    })

    test('should truncate long individual values', () => {
      const longValue = 'This is a very long sample value that should be truncated for display'
      const values = [longValue, 'short']
      const result = formatSampleValuesForTooltip(values)

      expect(result).toContain('This is a very long sample val...')
      expect(result).toContain('short')
    })

    test('should respect custom maxDisplay parameter', () => {
      const values = ['val1', 'val2', 'val3', 'val4']
      const result = formatSampleValuesForTooltip(values, 2)

      expect(result).toBe('val1, val2, ... (+2 more)')
    })
  })

  describe('generateColumnTooltip', () => {
    test('should combine data type and sample information', () => {
      const column: ColumnInfo = {
        name: 'test_column',
        dataType: 'VARCHAR',
        sampleValues: ['sample1', 'sample2'],
        nullable: true,
        uniqueCount: 50,
      }

      const tooltip = generateColumnTooltip(column)

      expect(tooltip).toContain('Data Type: Text (VARCHAR)')
      expect(tooltip).toContain('Nullable: Yes')
      expect(tooltip).toContain('Unique Values: 50')
      expect(tooltip).toContain('Sample Values:')
      expect(tooltip).toContain('sample1, sample2')
    })

    test('should handle columns with no sample data', () => {
      const column: ColumnInfo = {
        name: 'empty_column',
        dataType: 'INTEGER',
        sampleValues: [],
        nullable: false,
      }

      const tooltip = generateColumnTooltip(column)

      expect(tooltip).toContain('Data Type: Number (INTEGER)')
      expect(tooltip).toContain('Sample Values:')
      expect(tooltip).toContain('No sample data available')
    })
  })

  describe('generateSampleStats', () => {
    test('should generate stats for normal values', () => {
      const values = ['val1', 'val2', 'val3']
      const stats = generateSampleStats(values)

      expect(stats.isEmpty).toBe(false)
      expect(stats.count).toBe(3)
      expect(stats.hasNulls).toBe(false)
      expect(stats.nullCount).toBe(0)
    })

    test('should detect null values', () => {
      const values = ['val1', 'null', '', 'val2']
      const stats = generateSampleStats(values)

      expect(stats.isEmpty).toBe(false)
      expect(stats.count).toBe(4)
      expect(stats.hasNulls).toBe(true)
      expect(stats.nullCount).toBe(2)
    })

    test('should handle empty sample arrays', () => {
      const values: string[] = []
      const stats = generateSampleStats(values)

      expect(stats.isEmpty).toBe(true)
      expect(stats.count).toBe(0)
      expect(stats.hasNulls).toBe(false)
      expect(stats.nullCount).toBe(0)
    })
  })

  describe('getDataTypeIcon', () => {
    test('should return correct icons for data types', () => {
      expect(getDataTypeIcon('VARCHAR')).toBe('pi-align-left')
      expect(getDataTypeIcon('INTEGER')).toBe('pi-hashtag')
      expect(getDataTypeIcon('DATE')).toBe('pi-calendar')
      expect(getDataTypeIcon('BOOLEAN')).toBe('pi-check-circle')
      expect(getDataTypeIcon('JSON')).toBe('pi-code')
    })

    test('should handle case insensitive input', () => {
      expect(getDataTypeIcon('varchar')).toBe('pi-align-left')
      expect(getDataTypeIcon('integer')).toBe('pi-hashtag')
    })

    test('should return default icon for unknown types', () => {
      expect(getDataTypeIcon('UNKNOWN')).toBe('pi-question-circle')
    })
  })

  describe('getDataTypeSeverity', () => {
    test('should return warning for incompatible types', () => {
      expect(getDataTypeSeverity('BOOLEAN')).toBe('warning')
    })

    test('should return success for highly compatible types', () => {
      expect(getDataTypeSeverity('VARCHAR')).toBe('success') // 4 compatible types
    })

    test('should return info for moderately compatible types', () => {
      expect(getDataTypeSeverity('INTEGER')).toBe('info') // 1 compatible type
    })

    test('should handle case insensitive input', () => {
      expect(getDataTypeSeverity('varchar')).toBe('success')
      expect(getDataTypeSeverity('boolean')).toBe('warning')
    })
  })
})
