import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  StatementSchemaMapping,
  PropertyReference,
  ValueMapping,
  StatementRank,
  PropertyValueMap,
  ReferenceSchemaMapping,
} from '@frontend/types/wikibase-schema'
import type { UUID } from 'crypto'
import { useSchemaBuilder } from '@frontend/composables/useSchemaBuilder'
import { ItemId } from '@backend/types/wikibase-schema'

export const useSchemaStore = defineStore('schema', () => {
  const { buildStatement } = useSchemaBuilder()

  const schemaId = ref<UUID | null>(null)
  const projectId = ref<UUID | null>(null)
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
    qualifiers: PropertyValueMap[] = [],
    references: ReferenceSchemaMapping[] = [],
  ): UUID => {
    const statement = buildStatement(property, valueMapping, rank, qualifiers, references)
    statements.value.push(statement)
    markDirty()

    return statement.id
  }

  const removeStatement = (statementId: UUID) => {
    const index = statements.value.findIndex((s) => s.id === statementId)

    if (index !== -1) {
      statements.value.splice(index, 1)
      markDirty()
    }
  }

  const updateStatementRank = (statementId: UUID, rank: StatementRank) => {
    const statement = statements.value.find((s) => s.id === statementId)

    if (statement) {
      statement.rank = rank
      markDirty()
    }
  }

  const updateStatementQualifiers = (statementId: UUID, qualifiers: PropertyValueMap[]) => {
    const statement = statements.value.find((s) => s.id === statementId)

    if (statement) {
      statement.qualifiers = qualifiers
      markDirty()
    }
  }

  const addQualifierToStatement = (statementId: UUID, qualifier: PropertyValueMap) => {
    const statement = statements.value.find((s) => s.id === statementId)

    if (statement) {
      statement.qualifiers.push(qualifier)
      markDirty()
    }
  }

  const removeQualifierFromStatement = (statementId: UUID, qualifierIndex: number) => {
    const statement = statements.value.find((s) => s.id === statementId)

    if (statement && qualifierIndex >= 0 && qualifierIndex < statement.qualifiers.length) {
      statement.qualifiers.splice(qualifierIndex, 1)
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
    projectId.value = null
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
    updateStatementQualifiers,
    addQualifierToStatement,
    removeQualifierFromStatement,
    markAsSaved,
    $reset,
    setLoading,
  }
})
