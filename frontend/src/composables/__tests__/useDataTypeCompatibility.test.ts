import { describe, test, expect } from 'bun:test'
import { useDataTypeCompatibility } from '@frontend/composables/useDataTypeCompatibility'
import type { WikibaseDataType } from '@frontend/types/wikibase-schema'

describe('useDataTypeCompatibility', () => {
  const { DATA_TYPE_COMPATIBILITY_MAP, getCompatibleWikibaseTypes, isDataTypeCompatible } =
    useDataTypeCompatibility()

  describe('DATA_TYPE_COMPATIBILITY_MAP', () => {
    test('should have correct mapping for string types', () => {
      expect(DATA_TYPE_COMPATIBILITY_MAP.VARCHAR).toEqual([
        'string',
        'url',
        'external-id',
        'monolingualtext',
      ])
      expect(DATA_TYPE_COMPATIBILITY_MAP.TEXT).toEqual(['string', 'monolingualtext'])
      expect(DATA_TYPE_COMPATIBILITY_MAP.STRING).toEqual([
        'string',
        'url',
        'external-id',
        'monolingualtext',
      ])
    })

    test('should have correct mapping for numeric types', () => {
      expect(DATA_TYPE_COMPATIBILITY_MAP.INTEGER).toEqual(['quantity'])
      expect(DATA_TYPE_COMPATIBILITY_MAP.DECIMAL).toEqual(['quantity'])
      expect(DATA_TYPE_COMPATIBILITY_MAP.NUMERIC).toEqual(['quantity'])
      expect(DATA_TYPE_COMPATIBILITY_MAP.FLOAT).toEqual(['quantity'])
      expect(DATA_TYPE_COMPATIBILITY_MAP.DOUBLE).toEqual(['quantity'])
    })

    test('should have correct mapping for date/time types', () => {
      expect(DATA_TYPE_COMPATIBILITY_MAP.DATE).toEqual(['time'])
      expect(DATA_TYPE_COMPATIBILITY_MAP.DATETIME).toEqual(['time'])
      expect(DATA_TYPE_COMPATIBILITY_MAP.TIMESTAMP).toEqual(['time'])
    })

    test('should have correct mapping for other types', () => {
      expect(DATA_TYPE_COMPATIBILITY_MAP.BOOLEAN).toEqual([])
      expect(DATA_TYPE_COMPATIBILITY_MAP.JSON).toEqual(['string'])
      expect(DATA_TYPE_COMPATIBILITY_MAP.ARRAY).toEqual(['string'])
    })
  })

  describe('getCompatibleWikibaseTypes', () => {
    test('should return correct types for VARCHAR', () => {
      const result = getCompatibleWikibaseTypes('VARCHAR')
      expect(result).toEqual(['string', 'url', 'external-id', 'monolingualtext'])
    })

    test('should return correct types for INTEGER', () => {
      const result = getCompatibleWikibaseTypes('INTEGER')
      expect(result).toEqual(['quantity'])
    })

    test('should return correct types for DATE', () => {
      const result = getCompatibleWikibaseTypes('DATE')
      expect(result).toEqual(['time'])
    })

    test('should handle case insensitive input', () => {
      const result = getCompatibleWikibaseTypes('varchar')
      expect(result).toEqual(['string', 'url', 'external-id', 'monolingualtext'])
    })

    test('should return empty array for unknown types', () => {
      const result = getCompatibleWikibaseTypes('UNKNOWN_TYPE')
      expect(result).toEqual([])
    })

    test('should return empty array for BOOLEAN', () => {
      const result = getCompatibleWikibaseTypes('BOOLEAN')
      expect(result).toEqual([])
    })
  })

  describe('isDataTypeCompatible', () => {
    test('should return true when column type is compatible', () => {
      const acceptedTypes: WikibaseDataType[] = ['string', 'quantity']

      expect(isDataTypeCompatible('VARCHAR', acceptedTypes)).toBe(true)
      expect(isDataTypeCompatible('INTEGER', acceptedTypes)).toBe(true)
    })

    test('should return false when column type is not compatible', () => {
      const acceptedTypes: WikibaseDataType[] = ['time']

      expect(isDataTypeCompatible('VARCHAR', acceptedTypes)).toBe(false)
      expect(isDataTypeCompatible('INTEGER', acceptedTypes)).toBe(false)
    })

    test('should handle case insensitive column types', () => {
      const acceptedTypes: WikibaseDataType[] = ['string']

      expect(isDataTypeCompatible('varchar', acceptedTypes)).toBe(true)
      expect(isDataTypeCompatible('VARCHAR', acceptedTypes)).toBe(true)
    })

    test('should return false for unknown column types', () => {
      const acceptedTypes: WikibaseDataType[] = ['string', 'quantity', 'time']

      expect(isDataTypeCompatible('UNKNOWN_TYPE', acceptedTypes)).toBe(false)
    })

    test('should return false for BOOLEAN type with any accepted types', () => {
      const acceptedTypes: WikibaseDataType[] = ['string', 'quantity', 'time']

      expect(isDataTypeCompatible('BOOLEAN', acceptedTypes)).toBe(false)
    })

    test('should return true when multiple compatible types exist', () => {
      const acceptedTypes: WikibaseDataType[] = ['url', 'external-id']

      expect(isDataTypeCompatible('VARCHAR', acceptedTypes)).toBe(true)
    })

    test('should return false when no compatible types exist', () => {
      const acceptedTypes: WikibaseDataType[] = ['time']

      expect(isDataTypeCompatible('BOOLEAN', acceptedTypes)).toBe(false)
    })
  })
})
