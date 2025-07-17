import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type {
  WikibaseSchemaMapping,
  StatementSchemaMapping,
  ColumnMapping,
  PropertyReference,
  ValueMapping,
  StatementRank,
  TermsSchemaMapping,
} from '@frontend/types/wikibase-schema'

export const useSchemaStore = defineStore('schema', () => {
  // State
  const schema = ref<WikibaseSchemaMapping | null>(null)
  const isLoading = ref(false)
  const isDirty = ref(false)
  const lastSaved = ref<Date | null>(null)

  // Computed properties
  const hasSchema = computed(() => schema.value !== null)

  // Safe schema accessor - creates default schema if none exists
  const currentSchema = computed(() => {
    if (!schema.value) {
      // Create a default schema when none exists
      const now = new Date().toISOString()
      const defaultSchema: WikibaseSchemaMapping = {
        id: Bun.randomUUIDv7(),
        projectId: 'default',
        name: 'Untitled Schema',
        wikibase: 'https://www.wikidata.org',
        item: {
          terms: {
            labels: {},
            descriptions: {},
            aliases: {},
          },
          statements: [],
        },
        createdAt: now,
        updatedAt: now,
      }
      schema.value = defaultSchema
      isDirty.value = true
    }
    return schema.value
  })

  const itemTerms = computed((): TermsSchemaMapping => {
    if (!schema.value) {
      return {
        labels: {},
        descriptions: {},
        aliases: {},
      }
    }
    return schema.value.item.terms
  })

  const statements = computed((): StatementSchemaMapping[] => {
    if (!schema.value) {
      return []
    }
    return schema.value.item.statements
  })

  const schemaId = computed(() => schema.value?.id ?? null)

  // Actions
  const createSchema = (projectId: string, wikibaseUrl: string) => {
    const now = new Date().toISOString()
    const newSchema: WikibaseSchemaMapping = {
      id: Bun.randomUUIDv7(),
      projectId,
      name: 'Untitled Schema',
      wikibase: wikibaseUrl,
      item: {
        terms: {
          labels: {},
          descriptions: {},
          aliases: {},
        },
        statements: [],
      },
      createdAt: now,
      updatedAt: now,
    }

    schema.value = newSchema
    isDirty.value = true
  }

  const setSchema = (newSchema: WikibaseSchemaMapping) => {
    schema.value = newSchema
    isDirty.value = false
    lastSaved.value = new Date(newSchema.updatedAt)
  }

  const updateSchemaName = (name: string) => {
    currentSchema.value.name = name
    markDirty()
  }

  const addLabelMapping = (languageCode: string, columnMapping: ColumnMapping) => {
    currentSchema.value.item.terms.labels[languageCode] = columnMapping
    markDirty()
  }

  const addDescriptionMapping = (languageCode: string, columnMapping: ColumnMapping) => {
    currentSchema.value.item.terms.descriptions[languageCode] = columnMapping
    markDirty()
  }

  const addAliasMapping = (languageCode: string, columnMapping: ColumnMapping) => {
    const current = currentSchema.value

    if (!current.item.terms.aliases[languageCode]) {
      current.item.terms.aliases[languageCode] = []
    }

    current.item.terms.aliases[languageCode].push(columnMapping)
    markDirty()
  }

  const removeLabelMapping = (languageCode: string) => {
    delete currentSchema.value.item.terms.labels[languageCode]
    markDirty()
  }

  const removeDescriptionMapping = (languageCode: string) => {
    delete currentSchema.value.item.terms.descriptions[languageCode]
    markDirty()
  }

  const removeAliasMapping = (languageCode: string, columnMapping: ColumnMapping) => {
    const current = currentSchema.value
    const aliases = current.item.terms.aliases[languageCode]

    if (!aliases) return

    const index = aliases.findIndex(
      (alias) =>
        alias.columnName === columnMapping.columnName && alias.dataType === columnMapping.dataType,
    )

    if (index !== -1) {
      aliases.splice(index, 1)

      // Clean up empty array
      if (aliases.length === 0) {
        delete current.item.terms.aliases[languageCode]
      }

      markDirty()
    }
  }

  const addStatement = (
    property: PropertyReference,
    valueMapping: ValueMapping,
    rank: StatementRank = 'normal',
  ): string => {
    const statementId = Bun.randomUUIDv7()
    const statement: StatementSchemaMapping = {
      id: statementId,
      property,
      value: valueMapping,
      rank,
      qualifiers: [],
      references: [],
    }

    currentSchema.value.item.statements.push(statement)
    markDirty()

    return statementId
  }

  const removeStatement = (statementId: string) => {
    const current = currentSchema.value
    const index = current.item.statements.findIndex((s) => s.id === statementId)

    if (index !== -1) {
      current.item.statements.splice(index, 1)
      markDirty()
    }
  }

  const updateStatementRank = (statementId: string, rank: StatementRank) => {
    const statement = currentSchema.value.item.statements.find((s) => s.id === statementId)

    if (statement) {
      statement.rank = rank
      markDirty()
    }
  }

  const markAsSaved = () => {
    isDirty.value = false
    lastSaved.value = new Date()

    if (schema.value) {
      schema.value.updatedAt = new Date().toISOString()
    }
  }

  const clearSchema = () => {
    schema.value = null
    isDirty.value = false
    lastSaved.value = null
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  // Helper functions
  const markDirty = () => {
    isDirty.value = true
    if (schema.value) {
      schema.value.updatedAt = new Date().toISOString()
    }
  }

  return {
    // State
    schema: readonly(schema),
    isLoading: readonly(isLoading),
    isDirty: readonly(isDirty),
    lastSaved: readonly(lastSaved),

    // Computed
    hasSchema,
    currentSchema,
    itemTerms,
    statements,
    schemaId,

    // Actions
    createSchema,
    setSchema,
    updateSchemaName,
    addLabelMapping,
    addDescriptionMapping,
    addAliasMapping,
    removeLabelMapping,
    removeDescriptionMapping,
    removeAliasMapping,
    addStatement,
    removeStatement,
    updateStatementRank,
    markAsSaved,
    clearSchema,
    setLoading,
  }
})
