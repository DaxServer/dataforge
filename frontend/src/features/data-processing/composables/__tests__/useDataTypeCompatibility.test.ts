import { describe, expect, test } from 'bun:test'
import { useDataTypeCompatibility } from '@frontend/features/data-processing/composables/useDataTypeCompatibility'
import type { ColumnInfo } from '@frontend/shared/types/wikibase-schema'

describe('useDataTypeCompatibility Composable', () => {
  const {
    isValidTextColumn,
    isDataTypeCompatible,
    getCompatibleWikibaseTypes,
    textCompatibleTypes,
  } = useDataTypeCompatibility()

  describe('isValidTextColumn', () => {
    test('should validate VARCHAR columns', () => {
      const columnInfo: ColumnInfo = {
        name: 'title',
        dataType: 'VARCHAR',
        sampleValues: ['Sample Title'],
        nullable: false,
      }

      expect(isValidTextColumn(columnInfo)).toBe(true)
    })

    test('should validate TEXT columns', () => {
      const columnInfo: ColumnInfo = {
        name: 'description',
        dataType: 'TEXT',
        sampleValues: ['Sample Description'],
        nullable: false,
      }

      expect(isValidTextColumn(columnInfo)).toBe(true)
    })

    test('should validate STRING columns', () => {
      const columnInfo: ColumnInfo = {
        name: 'name',
        dataType: 'STRING',
        sampleValues: ['Sample Name'],
        nullable: false,
      }

      expect(isValidTextColumn(columnInfo)).toBe(true)
    })

    test('should validate CHAR columns', () => {
      const columnInfo: ColumnInfo = {
        name: 'code',
        dataType: 'CHAR',
        sampleValues: ['A'],
        nullable: false,
      }

      expect(isValidTextColumn(columnInfo)).toBe(true)
    })

    test('should reject INTEGER columns', () => {
      const columnInfo: ColumnInfo = {
        name: 'count',
        dataType: 'INTEGER',
        sampleValues: ['123'],
        nullable: false,
      }

      expect(isValidTextColumn(columnInfo)).toBe(false)
    })

    test('should reject DECIMAL columns', () => {
      const columnInfo: ColumnInfo = {
        name: 'price',
        dataType: 'DECIMAL',
        sampleValues: ['19.99'],
        nullable: false,
      }

      expect(isValidTextColumn(columnInfo)).toBe(false)
    })

    test('should reject BOOLEAN columns', () => {
      const columnInfo: ColumnInfo = {
        name: 'active',
        dataType: 'BOOLEAN',
        sampleValues: ['true'],
        nullable: false,
      }

      expect(isValidTextColumn(columnInfo)).toBe(false)
    })

    test('should reject DATE columns', () => {
      const columnInfo: ColumnInfo = {
        name: 'created_at',
        dataType: 'DATE',
        sampleValues: ['2023-01-01'],
        nullable: false,
      }

      expect(isValidTextColumn(columnInfo)).toBe(false)
    })

    test('should reject TIMESTAMP columns', () => {
      const columnInfo: ColumnInfo = {
        name: 'updated_at',
        dataType: 'TIMESTAMP',
        sampleValues: ['2023-01-01 12:00:00'],
        nullable: false,
      }

      expect(isValidTextColumn(columnInfo)).toBe(false)
    })

    test('should handle case insensitivity for varchar', () => {
      const columnInfo: ColumnInfo = {
        name: 'title',
        dataType: 'varchar',
        sampleValues: ['Sample'],
        nullable: false,
      }

      expect(isValidTextColumn(columnInfo)).toBe(true)
    })

    test('should handle case insensitivity for text', () => {
      const columnInfo: ColumnInfo = {
        name: 'description',
        dataType: 'text',
        sampleValues: ['Sample'],
        nullable: false,
      }

      expect(isValidTextColumn(columnInfo)).toBe(true)
    })

    test('should handle null column', () => {
      expect(isValidTextColumn(null)).toBe(false)
    })
  })

  describe('isDataTypeCompatible', () => {
    test('should check VARCHAR compatibility with string types', () => {
      const result = isDataTypeCompatible('VARCHAR', ['string'])
      expect(result).toBe(true)
    })

    test('should check VARCHAR compatibility with url types', () => {
      const result = isDataTypeCompatible('VARCHAR', ['url'])
      expect(result).toBe(true)
    })

    test('should check VARCHAR incompatibility with quantity types', () => {
      const result = isDataTypeCompatible('VARCHAR', ['quantity'])
      expect(result).toBe(false)
    })

    test('should check INTEGER compatibility with quantity types', () => {
      const result = isDataTypeCompatible('INTEGER', ['quantity'])
      expect(result).toBe(true)
    })

    test('should check INTEGER incompatibility with string types', () => {
      const result = isDataTypeCompatible('INTEGER', ['string'])
      expect(result).toBe(false)
    })

    test('should check DATE compatibility with time types', () => {
      const result = isDataTypeCompatible('DATE', ['time'])
      expect(result).toBe(true)
    })

    test('should check DATE incompatibility with string types', () => {
      const result = isDataTypeCompatible('DATE', ['string'])
      expect(result).toBe(false)
    })

    test('should handle multiple accepted types', () => {
      const result = isDataTypeCompatible('VARCHAR', ['string', 'url', 'external-id'])
      expect(result).toBe(true)
    })

    test('should handle empty accepted types array', () => {
      const result = isDataTypeCompatible('VARCHAR', [])
      expect(result).toBe(false)
    })

    test('should handle unknown column type', () => {
      const result = isDataTypeCompatible('UNKNOWN_TYPE', ['string'])
      expect(result).toBe(false)
    })
  })

  describe('textCompatibleTypes', () => {
    test('should expose reactive text compatible types', () => {
      expect(textCompatibleTypes.value).toContain('VARCHAR')
      expect(textCompatibleTypes.value).toContain('TEXT')
      expect(textCompatibleTypes.value).toContain('STRING')
      expect(textCompatibleTypes.value).toContain('CHAR')
    })

    test('should be readonly reactive reference', () => {
      // Should be a reactive reference
      expect(textCompatibleTypes.value).toBeDefined()
      expect(Array.isArray(textCompatibleTypes.value)).toBe(true)
    })
  })

  describe('getCompatibleWikibaseTypes', () => {
    test('should return compatible types for VARCHAR', () => {
      const result = getCompatibleWikibaseTypes('VARCHAR')
      expect(result).toContain('string')
      expect(result).toContain('url')
      expect(result).toContain('external-id')
      expect(result).toContain('monolingualtext')
    })

    test('should return compatible types for TEXT', () => {
      const result = getCompatibleWikibaseTypes('TEXT')
      expect(result).toContain('string')
      expect(result).toContain('monolingualtext')
    })

    test('should return compatible types for INTEGER', () => {
      const result = getCompatibleWikibaseTypes('INTEGER')
      expect(result).toContain('quantity')
    })

    test('should return compatible types for DATE', () => {
      const result = getCompatibleWikibaseTypes('DATE')
      expect(result).toContain('time')
    })

    test('should return empty array for unknown type', () => {
      const result = getCompatibleWikibaseTypes('UNKNOWN_TYPE')
      expect(result).toEqual([])
    })

    test('should handle case insensitivity', () => {
      const result = getCompatibleWikibaseTypes('varchar')
      expect(result).toContain('string')
      expect(result).toContain('url')
    })
  })
})
