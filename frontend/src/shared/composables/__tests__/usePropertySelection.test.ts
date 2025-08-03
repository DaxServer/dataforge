import { describe, test, expect, beforeEach } from 'bun:test'
import { usePropertySelection } from '@frontend/features/wikibase-schema/composables/usePropertySelection'
import type { PropertyReference } from '@frontend/shared/types/wikibase-schema'

describe('usePropertySelection', () => {
  let composable: ReturnType<typeof usePropertySelection>

  beforeEach(() => {
    composable = usePropertySelection()
  })

  describe('property management', () => {
    test('should get all properties', () => {
      const { getAllProperties } = composable

      const properties = getAllProperties()

      expect(properties.length).toBeGreaterThan(0)
      expect(properties.some((p) => p.id === 'P31')).toBe(true)
      expect(properties.some((p) => p.id === 'P279')).toBe(true)
    })

    test('should filter properties by P-ID', () => {
      const { filterProperties } = composable

      const filtered = filterProperties('P31')

      expect(filtered.length).toBeGreaterThan(0)
      expect(filtered.some((p) => p.id === 'P31')).toBe(true)
    })

    test('should filter properties by label', () => {
      const { filterProperties } = composable

      const filtered = filterProperties('instance')

      expect(filtered.length).toBeGreaterThan(0)
      expect(filtered.some((p) => p.id === 'P31')).toBe(true)
    })

    test('should filter case-insensitively', () => {
      const { filterProperties } = composable

      const filtered = filterProperties('INSTANCE')

      expect(filtered.length).toBeGreaterThan(0)
      expect(filtered.some((p) => p.id === 'P31')).toBe(true)
    })

    test('should return all properties for empty query', () => {
      const { filterProperties, getAllProperties } = composable

      const filtered = filterProperties('')
      const all = getAllProperties()

      expect(filtered).toEqual(all)
    })

    test('should return empty results for no matches', () => {
      const { filterProperties } = composable

      const filtered = filterProperties('nonexistent')

      expect(filtered).toHaveLength(0)
    })

    test('should handle whitespace in query', () => {
      const { filterProperties } = composable

      const filtered = filterProperties('  instance  ')

      expect(filtered.length).toBeGreaterThan(0)
      expect(filtered.some((p) => p.id === 'P31')).toBe(true)
    })
  })

  describe('property selection', () => {
    test('should initialize with null selection', () => {
      const { selectedProperty } = composable

      expect(selectedProperty.value).toBeNull()
    })

    test('should select and clear properties', () => {
      const { selectedProperty, selectProperty, clearSelection } = composable

      const property: PropertyReference = {
        id: 'P31',
        label: 'instance of',
        dataType: 'wikibase-item',
      }

      selectProperty(property)
      expect(selectedProperty.value).toEqual(property)

      clearSelection()
      expect(selectedProperty.value).toBeNull()
    })
  })
})
