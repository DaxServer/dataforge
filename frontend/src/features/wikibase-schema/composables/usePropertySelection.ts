import { ref, readonly } from 'vue'
import type { PropertyReference } from '@backend/api/project/project.wikibase'

/**
 * Composable for property selection with searchable dropdown functionality
 */
export const usePropertySelection = () => {
  // Reactive state
  const selectedProperty = ref<PropertyReference | null>(null)

  // Common Wikibase properties for suggestions
  const commonProperties: PropertyReference[] = [
    { id: 'P31', label: 'instance of', dataType: 'wikibase-item' },
    { id: 'P279', label: 'subclass of', dataType: 'wikibase-item' },
    { id: 'P1476', label: 'title', dataType: 'monolingualtext' },
    { id: 'P569', label: 'date of birth', dataType: 'time' },
    { id: 'P570', label: 'date of death', dataType: 'time' },
    { id: 'P19', label: 'place of birth', dataType: 'wikibase-item' },
    { id: 'P20', label: 'place of death', dataType: 'wikibase-item' },
    { id: 'P27', label: 'country of citizenship', dataType: 'wikibase-item' },
    { id: 'P106', label: 'occupation', dataType: 'wikibase-item' },
    { id: 'P21', label: 'sex or gender', dataType: 'wikibase-item' },
    { id: 'P735', label: 'given name', dataType: 'wikibase-item' },
    { id: 'P734', label: 'family name', dataType: 'wikibase-item' },
    { id: 'P18', label: 'image', dataType: 'commonsMedia' },
    { id: 'P856', label: 'official website', dataType: 'url' },
    { id: 'P854', label: 'reference URL', dataType: 'url' },
    { id: 'P248', label: 'stated in', dataType: 'wikibase-item' },
    { id: 'P813', label: 'retrieved', dataType: 'time' },
    { id: 'P577', label: 'publication date', dataType: 'time' },
    { id: 'P50', label: 'author', dataType: 'wikibase-item' },
    { id: 'P123', label: 'publisher', dataType: 'wikibase-item' },
  ]

  // Data type specific property suggestions
  // @ts-expect-error
  const dataTypeProperties: Record<WikibaseDataType, PropertyReference[]> = {
    string: [
      { id: 'P1476', label: 'title', dataType: 'monolingualtext' },
      { id: 'P2093', label: 'author name string', dataType: 'string' },
      { id: 'P1810', label: 'subject named as', dataType: 'string' },
    ],
    'wikibase-item': [
      { id: 'P31', label: 'instance of', dataType: 'wikibase-item' },
      { id: 'P279', label: 'subclass of', dataType: 'wikibase-item' },
      { id: 'P19', label: 'place of birth', dataType: 'wikibase-item' },
      { id: 'P27', label: 'country of citizenship', dataType: 'wikibase-item' },
    ],
    time: [
      { id: 'P569', label: 'date of birth', dataType: 'time' },
      { id: 'P570', label: 'date of death', dataType: 'time' },
      { id: 'P577', label: 'publication date', dataType: 'time' },
      { id: 'P813', label: 'retrieved', dataType: 'time' },
    ],
    quantity: [
      { id: 'P2043', label: 'length', dataType: 'quantity' },
      { id: 'P2044', label: 'elevation above sea level', dataType: 'quantity' },
      { id: 'P1082', label: 'population', dataType: 'quantity' },
    ],
    url: [
      { id: 'P856', label: 'official website', dataType: 'url' },
      { id: 'P854', label: 'reference URL', dataType: 'url' },
      { id: 'P973', label: 'described at URL', dataType: 'url' },
    ],
    commonsMedia: [
      { id: 'P18', label: 'image', dataType: 'commonsMedia' },
      { id: 'P41', label: 'flag image', dataType: 'commonsMedia' },
      { id: 'P94', label: 'coat of arms image', dataType: 'commonsMedia' },
    ],
    'external-id': [
      { id: 'P213', label: 'ISNI', dataType: 'external-id' },
      { id: 'P214', label: 'VIAF ID', dataType: 'external-id' },
      { id: 'P227', label: 'GND ID', dataType: 'external-id' },
    ],
    'globe-coordinate': [
      { id: 'P625', label: 'coordinate location', dataType: 'globe-coordinate' },
    ],
    monolingualtext: [
      { id: 'P1476', label: 'title', dataType: 'monolingualtext' },
      { id: 'P1448', label: 'official name', dataType: 'monolingualtext' },
    ],
    'wikibase-property': [
      { id: 'P1687', label: 'Wikidata property', dataType: 'wikibase-property' },
    ],
  }

  const getAllProperties = (): PropertyReference[] => {
    return commonProperties
  }

  // Filter properties based on search query
  const filterProperties = (query: string): PropertyReference[] => {
    if (!query.trim()) {
      return commonProperties
    }

    const searchTerm = query.toLowerCase().trim()

    return commonProperties.filter((property) => {
      const idMatch = property.id.toLowerCase().includes(searchTerm)
      const labelMatch = property.label?.toLowerCase().includes(searchTerm) || false
      return idMatch || labelMatch
    })
  }

  // Methods
  const selectProperty = (property: PropertyReference) => {
    selectedProperty.value = property
  }

  const clearSelection = () => {
    selectedProperty.value = null
  }

  return {
    // State
    selectedProperty: readonly(selectedProperty),

    // Methods
    getAllProperties,
    selectProperty,
    clearSelection,
    filterProperties,
  }
}
