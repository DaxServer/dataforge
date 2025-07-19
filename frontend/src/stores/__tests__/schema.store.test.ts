import { describe, it, expect, beforeEach } from 'bun:test'
import { createPinia, setActivePinia } from 'pinia'
import { useSchemaStore } from '@frontend/stores/schema.store'
import type {
  WikibaseSchemaMapping,
  ColumnMapping,
  PropertyReference,
} from '@frontend/types/wikibase-schema'

describe('useSchemaStore', () => {
  let store: ReturnType<typeof useSchemaStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useSchemaStore()
  })

  describe('store initialization', () => {
    it('should initialize with default empty state', () => {
      expect(store.schema).toBeNull()
      expect(store.isLoading).toBe(false)
      expect(store.isDirty).toBe(false)
      expect(store.lastSaved).toBeNull()
    })

    it('should have computed properties with correct initial values', () => {
      expect(store.hasSchema).toBe(false)
      expect(store.itemTerms).toEqual({
        labels: {},
        descriptions: {},
        aliases: {},
      })
      expect(store.statements).toEqual([])
      expect(store.schemaId).toBeNull()
    })
  })

  describe('schema behavior', () => {
    it('should not auto-create schema when calling updateSchemaName with no existing schema', () => {
      // Initially no schema
      expect(store.schema).toBeNull()
      expect(store.hasSchema).toBe(false)

      // Calling updateSchemaName should not auto-create a schema
      store.updateSchemaName('Test Auto Schema')

      // Should still have no schema
      expect(store.schema).toBeNull()
      expect(store.hasSchema).toBe(false)
    })

    it('should create default schema with proper structure when explicitly created', () => {
      // Explicitly create schema first
      store.createSchema('default', 'https://www.wikidata.org')
      store.addLabelMapping('en', { columnName: 'test', dataType: 'VARCHAR' })

      expect(store.schema).not.toBeNull()
      expect(store.schema?.id).toBeDefined()
      expect(store.schema?.projectId).toBe('default')
      expect(store.schema?.name).toBe('Untitled Schema')
      expect(store.schema?.wikibase).toBe('https://www.wikidata.org')
      expect(store.schema?.item.terms.labels).toEqual({
        en: { columnName: 'test', dataType: 'VARCHAR' },
      })
      expect(store.schema?.item.terms.descriptions).toEqual({})
      expect(store.schema?.item.terms.aliases).toEqual({})
      expect(store.schema?.item.statements).toEqual([])
      expect(store.schema?.createdAt).toBeDefined()
      expect(store.schema?.updatedAt).toBeDefined()
      expect(store.isDirty).toBe(true)
    })

    it('should update existing schema without creating new one', () => {
      // Create explicit schema first
      store.createSchema('explicit-project', 'https://explicit.wikibase.org')
      const originalId = store.schema?.id

      // Update schema name should modify existing schema
      store.updateSchemaName('Updated Name')

      expect(store.schema?.id).toBe(originalId)
      expect(store.schema?.projectId).toBe('explicit-project')
      expect(store.schema?.wikibase).toBe('https://explicit.wikibase.org')
      expect(store.schema?.name).toBe('Updated Name')
    })
  })

  describe('schema creation and initialization', () => {
    it('should create a new schema with default structure', () => {
      const projectId = 'test-project-123'
      const wikibaseUrl = 'https://test.wikibase.org'

      store.createSchema(projectId, wikibaseUrl)

      expect(store.schema).not.toBeNull()
      expect(store.schema?.projectId).toBe(projectId)
      expect(store.schema?.wikibase).toBe(wikibaseUrl)
      expect(store.schema?.name).toBe('Untitled Schema')
      expect(store.schema?.item.terms.labels).toEqual({})
      expect(store.schema?.item.terms.descriptions).toEqual({})
      expect(store.schema?.item.terms.aliases).toEqual({})
      expect(store.schema?.item.statements).toEqual([])
      expect(store.isDirty).toBe(true)
      expect(store.hasSchema).toBe(true)
    })

    it('should generate unique schema ID on creation', () => {
      store.createSchema('project1', 'https://wikibase1.org')
      const firstId = store.schema?.id

      store.createSchema('project2', 'https://wikibase2.org')
      const secondId = store.schema?.id

      expect(firstId).toBeDefined()
      expect(secondId).toBeDefined()
      expect(firstId).not.toBe(secondId)
    })

    it('should set schema from existing data', () => {
      const existingSchema: WikibaseSchemaMapping = {
        id: 'existing-schema-123',
        projectId: 'project-456',
        name: 'Test Schema',
        wikibase: 'https://existing.wikibase.org',
        item: {
          terms: {
            labels: { en: { columnName: 'title', dataType: 'VARCHAR' } },
            descriptions: {},
            aliases: {},
          },
          statements: [],
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      store.setSchema(existingSchema)

      expect(store.schema).toEqual(existingSchema)
      expect(store.isDirty).toBe(false)
      expect(store.hasSchema).toBe(true)
      expect(store.schemaId).toBe('existing-schema-123')
    })
  })

  describe('schema state updates and reactivity', () => {
    beforeEach(() => {
      store.createSchema('test-project', 'https://test.wikibase.org')
    })

    it('should update schema name and mark as dirty', () => {
      const newName = 'Updated Schema Name'

      store.updateSchemaName(newName)

      expect(store.schema?.name).toBe(newName)
      expect(store.isDirty).toBe(true)
    })

    it('should add label mapping and update computed properties', () => {
      const columnMapping: ColumnMapping = {
        columnName: 'title_column',
        dataType: 'VARCHAR',
      }

      store.addLabelMapping('en', columnMapping)

      expect(store.schema?.item.terms.labels.en).toEqual(columnMapping)
      expect(store.itemTerms.labels.en).toEqual(columnMapping)
      expect(store.isDirty).toBe(true)
    })

    it('should add description mapping', () => {
      const columnMapping: ColumnMapping = {
        columnName: 'description_column',
        dataType: 'TEXT',
      }

      store.addDescriptionMapping('fr', columnMapping)

      expect(store.schema?.item.terms.descriptions.fr).toEqual(columnMapping)
      expect(store.itemTerms.descriptions.fr).toEqual(columnMapping)
      expect(store.isDirty).toBe(true)
    })

    it('should add alias mapping (multiple aliases per language)', () => {
      const alias1: ColumnMapping = {
        columnName: 'alias1_column',
        dataType: 'VARCHAR',
      }
      const alias2: ColumnMapping = {
        columnName: 'alias2_column',
        dataType: 'VARCHAR',
      }

      store.addAliasMapping('de', alias1)
      store.addAliasMapping('de', alias2)

      expect(store.schema?.item.terms.aliases.de).toHaveLength(2)
      expect(store.schema?.item.terms.aliases.de?.[0]).toEqual(alias1)
      expect(store.schema?.item.terms.aliases.de?.[1]).toEqual(alias2)
      expect(store.itemTerms.aliases.de).toHaveLength(2)
      expect(store.isDirty).toBe(true)
    })

    it('should remove label mapping', () => {
      const columnMapping: ColumnMapping = {
        columnName: 'title_column',
        dataType: 'VARCHAR',
      }

      store.addLabelMapping('en', columnMapping)
      expect(store.schema?.item.terms.labels.en).toBeDefined()

      store.removeLabelMapping('en')

      expect(store.schema?.item.terms.labels.en).toBeUndefined()
      expect(store.itemTerms.labels.en).toBeUndefined()
      expect(store.isDirty).toBe(true)
    })

    it('should remove description mapping', () => {
      const columnMapping: ColumnMapping = {
        columnName: 'desc_column',
        dataType: 'TEXT',
      }

      store.addDescriptionMapping('es', columnMapping)
      expect(store.schema?.item.terms.descriptions.es).toBeDefined()

      store.removeDescriptionMapping('es')

      expect(store.schema?.item.terms.descriptions.es).toBeUndefined()
      expect(store.isDirty).toBe(true)
    })

    it('should remove specific alias mapping', () => {
      const alias1: ColumnMapping = {
        columnName: 'alias1_column',
        dataType: 'VARCHAR',
      }
      const alias2: ColumnMapping = {
        columnName: 'alias2_column',
        dataType: 'VARCHAR',
      }

      store.addAliasMapping('it', alias1)
      store.addAliasMapping('it', alias2)
      expect(store.schema?.item.terms.aliases.it).toHaveLength(2)

      store.removeAliasMapping('it', alias1)

      expect(store.schema?.item.terms.aliases.it).toHaveLength(1)
      expect(store.schema?.item.terms.aliases.it?.[0]).toEqual(alias2)
      expect(store.isDirty).toBe(true)
    })

    it('should add statement and update computed properties', () => {
      const property: PropertyReference = {
        id: 'P31',
        label: 'instance of',
        dataType: 'wikibase-item',
      }
      const columnMapping: ColumnMapping = {
        columnName: 'type_column',
        dataType: 'VARCHAR',
      }

      const statementId = store.addStatement(property, {
        type: 'column',
        source: columnMapping,
        dataType: 'wikibase-item',
      })

      expect(store.schema?.item.statements).toHaveLength(1)
      expect(store.statements).toHaveLength(1)
      expect(store.statements[0]?.id).toBe(statementId)
      expect(store.statements[0]?.property).toEqual(property)
      expect(store.isDirty).toBe(true)
    })

    it('should remove statement', () => {
      const property: PropertyReference = {
        id: 'P31',
        label: 'instance of',
        dataType: 'wikibase-item',
      }
      const columnMapping: ColumnMapping = {
        columnName: 'type_column',
        dataType: 'VARCHAR',
      }

      const statementId = store.addStatement(property, {
        type: 'column',
        source: columnMapping,
        dataType: 'wikibase-item',
      })

      expect(store.statements).toHaveLength(1)

      store.removeStatement(statementId)

      expect(store.statements).toHaveLength(0)
      expect(store.schema?.item.statements).toHaveLength(0)
      expect(store.isDirty).toBe(true)
    })

    it('should update statement rank', () => {
      const property: PropertyReference = {
        id: 'P31',
        label: 'instance of',
        dataType: 'wikibase-item',
      }
      const columnMapping: ColumnMapping = {
        columnName: 'type_column',
        dataType: 'VARCHAR',
      }

      const statementId = store.addStatement(property, {
        type: 'column',
        source: columnMapping,
        dataType: 'wikibase-item',
      })

      store.updateStatementRank(statementId, 'preferred')

      const statement = store.statements.find((s) => s.id === statementId)
      expect(statement?.rank).toBe('preferred')
      expect(store.isDirty).toBe(true)
    })
  })

  describe('schema persistence state', () => {
    beforeEach(() => {
      store.createSchema('test-project', 'https://test.wikibase.org')
    })

    it('should mark schema as saved and update lastSaved timestamp', () => {
      expect(store.isDirty).toBe(true)
      expect(store.lastSaved).toBeNull()

      store.markAsSaved()

      expect(store.isDirty).toBe(false)
      expect(store.lastSaved).not.toBeNull()
      expect(store.lastSaved).toBeInstanceOf(Date)
    })

    it('should clear schema and reset state', () => {
      store.addLabelMapping('en', { columnName: 'test', dataType: 'VARCHAR' })
      expect(store.hasSchema).toBe(true)
      expect(store.isDirty).toBe(true)

      store.clearSchema()

      expect(store.schema).toBeNull()
      expect(store.hasSchema).toBe(false)
      expect(store.isDirty).toBe(false)
      expect(store.lastSaved).toBeNull()
    })

    it('should track loading state', () => {
      expect(store.isLoading).toBe(false)

      store.setLoading(true)
      expect(store.isLoading).toBe(true)

      store.setLoading(false)
      expect(store.isLoading).toBe(false)
    })
  })

  describe('computed properties reactivity', () => {
    beforeEach(() => {
      store.createSchema('test-project', 'https://test.wikibase.org')
    })

    it('should update hasSchema when schema changes', () => {
      expect(store.hasSchema).toBe(true)

      store.clearSchema()
      expect(store.hasSchema).toBe(false)

      store.createSchema('new-project', 'https://new.wikibase.org')
      expect(store.hasSchema).toBe(true)
    })

    it('should update itemTerms when terms change', () => {
      const labelMapping: ColumnMapping = { columnName: 'title', dataType: 'VARCHAR' }
      const descMapping: ColumnMapping = { columnName: 'desc', dataType: 'TEXT' }

      store.addLabelMapping('en', labelMapping)
      store.addDescriptionMapping('fr', descMapping)

      expect(store.itemTerms.labels.en).toEqual(labelMapping)
      expect(store.itemTerms.descriptions.fr).toEqual(descMapping)

      store.removeLabelMapping('en')
      expect(store.itemTerms.labels.en).toBeUndefined()
    })

    it('should update statements when statements change', () => {
      expect(store.statements).toEqual([])

      const property: PropertyReference = {
        id: 'P31',
        label: 'instance of',
        dataType: 'wikibase-item',
      }

      const statementId = store.addStatement(property, {
        type: 'column',
        source: { columnName: 'type', dataType: 'VARCHAR' },
        dataType: 'wikibase-item',
      })

      expect(store.statements).toHaveLength(1)
      expect(store.statements[0]?.id).toBe(statementId)

      store.removeStatement(statementId)
      expect(store.statements).toEqual([])
    })

    it('should update schemaId when schema changes', () => {
      const initialId = store.schemaId
      expect(initialId).toBeDefined()

      store.clearSchema()
      expect(store.schemaId).toBeNull()

      const existingSchema: WikibaseSchemaMapping = {
        id: 'custom-id-123',
        projectId: 'project',
        name: 'Test',
        wikibase: 'https://test.org',
        item: {
          terms: { labels: {}, descriptions: {}, aliases: {} },
          statements: [],
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      store.setSchema(existingSchema)
      expect(store.schemaId).toBe('custom-id-123')
    })
  })
})
