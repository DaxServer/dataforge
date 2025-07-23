import { describe, test, expect, beforeEach } from 'bun:test'
import { createPinia, setActivePinia } from 'pinia'
import { useLanguageDropZone } from '@frontend/composables/useLanguageDropZone'
import { useSchemaStore } from '@frontend/stores/schema.store'

describe('useLanguageDropZone Composable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('label term type', () => {
    test('should initialize with default state', () => {
      const { selectedLanguage, hasExistingMappings, mappingDisplayData } =
        useLanguageDropZone('label')

      expect(selectedLanguage.value).toBe('en')
      expect(hasExistingMappings.value).toBe(false)
      expect(mappingDisplayData.value).toEqual([])
    })

    test('should detect existing mappings reactively', () => {
      const schemaStore = useSchemaStore()
      const { hasExistingMappings } = useLanguageDropZone('label')

      expect(hasExistingMappings.value).toBe(false)

      schemaStore.addLabelMapping('en', {
        columnName: 'title',
        dataType: 'VARCHAR',
      })

      expect(hasExistingMappings.value).toBe(true)
    })

    test('should transform mappings into display format', () => {
      const schemaStore = useSchemaStore()
      const { mappingDisplayData } = useLanguageDropZone('label')

      schemaStore.addLabelMapping('en', {
        columnName: 'title_en',
        dataType: 'VARCHAR',
      })
      schemaStore.addLabelMapping('es', {
        columnName: 'title_es',
        dataType: 'VARCHAR',
      })

      expect(mappingDisplayData.value).toHaveLength(2)
    })

    test('should handle dynamic language codes', () => {
      const schemaStore = useSchemaStore()
      const { mappingDisplayData } = useLanguageDropZone('label')

      schemaStore.addLabelMapping('xyz', {
        columnName: 'title_xyz',
        dataType: 'VARCHAR',
      })

      expect(mappingDisplayData.value).toHaveLength(1)
      expect(mappingDisplayData.value[0].languageCode).toBe('xyz')
      expect(mappingDisplayData.value[0].isArray).toBe(false)
    })

    test('should remove mappings correctly', () => {
      const schemaStore = useSchemaStore()
      const { removeMapping, hasExistingMappings } = useLanguageDropZone('label')

      schemaStore.addLabelMapping('en', {
        columnName: 'title',
        dataType: 'VARCHAR',
      })

      expect(hasExistingMappings.value).toBe(true)

      removeMapping('en')

      expect(hasExistingMappings.value).toBe(false)
    })
  })

  describe('description term type', () => {
    test('should work with descriptions store property', () => {
      const schemaStore = useSchemaStore()
      const { hasExistingMappings, mappingDisplayData } = useLanguageDropZone('description')

      expect(hasExistingMappings.value).toBe(false)

      schemaStore.addDescriptionMapping('en', {
        columnName: 'description',
        dataType: 'TEXT',
      })

      expect(hasExistingMappings.value).toBe(true)
      expect(mappingDisplayData.value).toHaveLength(1)
      expect(mappingDisplayData.value[0].isArray).toBe(false)
    })

    test('should remove description mappings correctly', () => {
      const schemaStore = useSchemaStore()
      const { removeMapping, hasExistingMappings } = useLanguageDropZone('description')

      schemaStore.addDescriptionMapping('en', {
        columnName: 'description',
        dataType: 'TEXT',
      })

      expect(hasExistingMappings.value).toBe(true)

      removeMapping('en')

      expect(hasExistingMappings.value).toBe(false)
    })
  })

  describe('alias term type', () => {
    test('should work with aliases store property', () => {
      const schemaStore = useSchemaStore()
      const { hasExistingMappings, mappingDisplayData } = useLanguageDropZone('alias')

      expect(hasExistingMappings.value).toBe(false)

      schemaStore.addAliasMapping('en', { columnName: 'alias1', dataType: 'VARCHAR' })
      schemaStore.addAliasMapping('en', { columnName: 'alias2', dataType: 'VARCHAR' })

      expect(hasExistingMappings.value).toBe(true)
      expect(mappingDisplayData.value).toHaveLength(1)
      expect(mappingDisplayData.value[0].isArray).toBe(true)
      expect(mappingDisplayData.value[0].mappings).toHaveLength(2)
    })

    test('should remove alias mappings correctly', () => {
      const schemaStore = useSchemaStore()
      const { removeMapping } = useLanguageDropZone('alias')

      const mapping1 = { columnName: 'alias1', dataType: 'VARCHAR' }
      const mapping2 = { columnName: 'alias2', dataType: 'VARCHAR' }

      schemaStore.addAliasMapping('en', mapping1)
      schemaStore.addAliasMapping('en', mapping2)

      removeMapping('en', mapping1)

      expect(schemaStore.aliases.en).toHaveLength(1)
    })

    test('should clean up empty alias arrays', () => {
      const schemaStore = useSchemaStore()
      const { removeMapping, hasExistingMappings } = useLanguageDropZone('alias')

      const mapping = { columnName: 'alias1', dataType: 'VARCHAR' }
      schemaStore.addAliasMapping('en', mapping)

      expect(hasExistingMappings.value).toBe(true)

      removeMapping('en', mapping)

      expect(hasExistingMappings.value).toBe(false)
    })
  })

  describe('reactivity', () => {
    test('should update hasExistingMappings when store changes', () => {
      const schemaStore = useSchemaStore()
      const { hasExistingMappings } = useLanguageDropZone('label')

      expect(hasExistingMappings.value).toBe(false)

      schemaStore.addLabelMapping('en', {
        columnName: 'title',
        dataType: 'VARCHAR',
      })

      expect(hasExistingMappings.value).toBe(true)

      schemaStore.removeLabelMapping('en')

      expect(hasExistingMappings.value).toBe(false)
    })

    test('should update mappingDisplayData when store changes', () => {
      const schemaStore = useSchemaStore()
      const { mappingDisplayData } = useLanguageDropZone('label')

      expect(mappingDisplayData.value).toHaveLength(0)

      schemaStore.addLabelMapping('en', {
        columnName: 'title',
        dataType: 'VARCHAR',
      })

      expect(mappingDisplayData.value).toHaveLength(1)

      schemaStore.addLabelMapping('es', {
        columnName: 'titulo',
        dataType: 'VARCHAR',
      })

      expect(mappingDisplayData.value).toHaveLength(2)

      schemaStore.removeLabelMapping('en')

      expect(mappingDisplayData.value).toHaveLength(1)
      expect(mappingDisplayData.value[0].languageCode).toBe('es')
    })
  })
})
