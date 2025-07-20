import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  StatementSchemaMapping,
  ColumnMapping,
  PropertyReference,
  ValueMapping,
  StatementRank,
  Label,
} from '@frontend/types/wikibase-schema'
import { useSchemaBuilder } from '@frontend/composables/useSchemaBuilder'
import { ItemId } from '@backend/types/wikibase-schema'

export const useSchemaStore = defineStore('schema', () => {
  const { buildStatement } = useSchemaBuilder()

  const schemaId = ref<string | null>(null)
  const projectId = ref<string>('')
  const schemaName = ref<string>('')
  const wikibase = ref<string>('')
  const itemId = ref<ItemId | null>(null)
  const labels = ref<Label>({})
  const descriptions = ref<Label>({})
  const aliases = ref<Record<string, ColumnMapping[]>>({})
  const statements = ref<StatementSchemaMapping[]>([])
  const createdAt = ref<string>('')
  const updatedAt = ref<string>('')

  // Meta state
  const isLoading = ref(false)
  const isDirty = ref(false)
  const lastSaved = ref<Date | null>(null)

  // Actions

  const updateSchemaName = (name: string) => {
    schemaName.value = name
    markDirty()
  }

  const addLabelMapping = (languageCode: string, columnMapping: ColumnMapping) => {
    labels.value[languageCode] = columnMapping
    markDirty()
  }

  const addDescriptionMapping = (languageCode: string, columnMapping: ColumnMapping) => {
    descriptions.value[languageCode] = columnMapping
    markDirty()
  }

  const addAliasMapping = (languageCode: string, columnMapping: ColumnMapping) => {
    if (!aliases.value[languageCode]) {
      aliases.value[languageCode] = []
    }

    aliases.value[languageCode].push(columnMapping)
    markDirty()
  }

  const removeLabelMapping = (languageCode: string) => {
    delete labels.value[languageCode]
    markDirty()
  }

  const removeDescriptionMapping = (languageCode: string) => {
    delete descriptions.value[languageCode]
    markDirty()
  }

  const removeAliasMapping = (languageCode: string, columnMapping: ColumnMapping) => {
    const aliasesForLanguage = aliases.value[languageCode]

    if (!aliasesForLanguage) return

    const index = aliasesForLanguage.findIndex(
      (alias) =>
        alias.columnName === columnMapping.columnName && alias.dataType === columnMapping.dataType,
    )

    if (index !== -1) {
      aliasesForLanguage.splice(index, 1)

      // Clean up empty array
      if (aliasesForLanguage.length === 0) {
        delete aliases.value[languageCode]
      }

      markDirty()
    }
  }

  const addStatement = (
    property: PropertyReference,
    valueMapping: ValueMapping,
    rank: StatementRank = 'normal',
  ): string => {
    const statement = buildStatement(property, valueMapping, rank)
    statements.value.push(statement)
    markDirty()

    return statement.id
  }

  const removeStatement = (statementId: string) => {
    const index = statements.value.findIndex((s) => s.id === statementId)

    if (index !== -1) {
      statements.value.splice(index, 1)
      markDirty()
    }
  }

  const updateStatementRank = (statementId: string, rank: StatementRank) => {
    const statement = statements.value.find((s) => s.id === statementId)

    if (statement) {
      statement.rank = rank
      markDirty()
    }
  }

  const markAsSaved = () => {
    const now = new Date()
    isDirty.value = false
    lastSaved.value = now
    updatedAt.value = now.toISOString()
  }

  const $reset = () => {
    schemaId.value = null
    projectId.value = ''
    schemaName.value = ''
    wikibase.value = ''
    itemId.value = null
    labels.value = {}
    descriptions.value = {}
    aliases.value = {}
    statements.value = []
    createdAt.value = ''
    updatedAt.value = ''
    isDirty.value = false
    lastSaved.value = null
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  // Helper functions
  const markDirty = () => {
    isDirty.value = true
  }

  return {
    // State
    schemaId,
    projectId,
    schemaName,
    wikibase,
    itemId,
    labels,
    descriptions,
    aliases,
    statements,
    createdAt,
    updatedAt,

    // Meta state
    isLoading,
    isDirty,
    lastSaved,

    // Actions
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
    $reset,
    setLoading,
  }
})
