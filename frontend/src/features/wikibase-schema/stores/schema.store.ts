import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UUID } from 'crypto'
import { useSchemaBuilder } from '@frontend/features/wikibase-schema/composables/useSchemaBuilder'
import { ItemId } from '@backend/types/wikibase-schema'
import type {
  ColumnMapping,
  Label,
  Alias,
  PropertyReference,
  PropertyValueMap,
  ReferenceSchemaMapping,
  StatementRank,
  StatementSchemaMapping,
  ValueMapping,
} from '@backend/api/project/project.wikibase'

export const useSchemaStore = defineStore('schema', () => {
  const { buildStatement } = useSchemaBuilder()

  const schemaId = ref<UUID | null>(null)
  const projectId = ref<UUID | null>(null)
  const schemaName = ref<string>('')
  const wikibase = ref<string>('')
  const itemId = ref<ItemId | null>(null)
  const labels = ref<Label>({})
  const descriptions = ref<Label>({})
  const aliases = ref<Alias>({})
  const statements: Ref<StatementSchemaMapping[]> = ref<StatementSchemaMapping[]>([])
  const createdAt = ref<string>('')
  const updatedAt = ref<string>('')

  const statements1 = ref<{ [key: UUID]: StatementSchema }>({})

  // Meta state
  const isLoading = ref(false)
  const isDirty = ref(false)
  const lastSaved = ref<Date | null>(null)

  // Computed
  const canSave = computed(() => {
    const hasContent =
      Object.keys(labels.value).length > 0 ||
      Object.keys(descriptions.value).length > 0 ||
      Object.keys(aliases.value).length > 0 ||
      Object.keys(statements1.value).length > 0

    return projectId.value !== null && isDirty.value && !isLoading.value && hasContent
  })

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

    // Check for duplicates before adding
    const existingAliases = aliases.value[languageCode]
    const isDuplicate = existingAliases.some(
      (alias) =>
        alias.columnName === columnMapping.columnName && alias.dataType === columnMapping.dataType,
    )

    if (!isDuplicate) {
      aliases.value[languageCode].push(columnMapping)
      markDirty()
    }
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

    if (index === -1) return

    aliasesForLanguage.splice(index, 1)

    // Clean up empty array
    if (aliasesForLanguage.length === 0) {
      delete aliases.value[languageCode]
    }

    markDirty()
  }

  const loadSchema = (response: WikibaseSchemaResponse, metadata: boolean = true) => {
    schemaId.value = response.id as UUID
    projectId.value = response.project_id as UUID
    schemaName.value = response.name
    wikibase.value = response.wikibase
    createdAt.value = response.created_at
    updatedAt.value = response.updated_at

    if (metadata) {
      labels.value = response.schema.terms?.labels || {}
      descriptions.value = response.schema.terms?.descriptions || {}
      aliases.value = response.schema.terms?.aliases || {}
      statements.value = response.schema.statements || []
      statements1.value = response.schema.statements.reduce(
        (acc, stmt) => {
          acc[stmt.id as UUID] = {
            ...stmt,
            id: stmt.id as UUID,
          }
          return acc
        },
        {} as { [key: UUID]: StatementSchema },
      )
      isDirty.value = false
      lastSaved.value = new Date(response.updated_at)
    }
  }

  const addNewStatement = () => {
    const id = crypto.randomUUID()
    statements1.value[id] = {
      id,
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
    statements1.value[statement.id as UUID] = {
      ...statement,
      id: statement.id as UUID,
    }
    markDirty()

    return statement.id as UUID
  }

  const removeStatement = (statementId: UUID) => {
    const index = statements.value.findIndex((s) => s.id === statementId)

    if (index !== -1) {
      statements.value.splice(index, 1)
      delete statements1.value[statementId]
      markDirty()
    }
  }

  const removeStatement1 = (statementId: UUID) => {
    delete statements1.value[statementId]
  }

  const updateStatementRank = (statementId: UUID, rank: StatementRank) => {
    const statement = statements.value.find((s) => s.id === statementId)

    if (statement) {
      statement.rank = rank
      statements1.value[statementId]!.rank = rank
      markDirty()
    }
  }

  const updateStatementQualifiers = (statementId: UUID, qualifiers: PropertyValueMap[]) => {
    const statement = statements.value.find((s) => s.id === statementId)

    if (statement) {
      statement.qualifiers = qualifiers
      statements1.value[statementId]!.qualifiers = qualifiers
      markDirty()
    }
  }

  const addQualifierToStatement = (statementId: UUID, qualifier: PropertyValueMap) => {
    const statement = statements.value.find((s) => s.id === statementId)

    if (statement) {
      statement.qualifiers.push(qualifier)
      statements1.value[statementId]!.qualifiers!.push(qualifier)
      markDirty()
    }
  }

  const removeQualifierFromStatement = (statementId: UUID, qualifierIndex: number) => {
    const statement = statements.value.find((s) => s.id === statementId)

    if (statement && qualifierIndex >= 0 && qualifierIndex < statement.qualifiers.length) {
      statement.qualifiers.splice(qualifierIndex, 1)
      statements1.value[statementId]!.qualifiers!.splice(qualifierIndex, 1)
      markDirty()
    }
  }

  const updateStatement = (
    statementId: UUID,
    property: PropertyReference,
    value: ValueMapping,
    rank: StatementRank,
    qualifiers: PropertyValueMap[] = [],
    references: ReferenceSchemaMapping[] = [],
  ) => {
    const statementIndex = statements.value.findIndex((s) => s.id === statementId)

    if (statementIndex !== -1) {
      const existingStatement = statements.value[statementIndex]
      if (existingStatement) {
        statements.value[statementIndex] = {
          id: existingStatement.id,
          property,
          value,
          rank,
          qualifiers,
          references,
        }
        statements1.value[statementId] = {
          id: existingStatement.id as UUID,
          property,
          value,
          rank,
          qualifiers,
          references,
        }
        markDirty()
      }
    }
  }

  const updateStatement1 = (statement: StatementSchema) => {
    statements1.value[statement.id] = statement
  }

  const updateStatementById = (
    id: UUID,
    property: keyof StatementSchema,
    value?:
      | PropertyReference
      | StatementRank
      | ValueMapping
      | PropertyValueMap[]
      | ReferenceSchemaMapping[],
  ) => {
    statements1.value[id] = {
      ...statements1.value[id],
      id,
      [property]: value,
    }
    markDirty()
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
    statements1.value = {}
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

    statements1,

    // Meta state
    isLoading,
    isDirty,
    lastSaved,

    // Computed
    canSave,
    hasStatements: computed(() => Object.keys(statements1.value).length > 0),
    countStatments: computed(() => Object.keys(statements1.value).length),

    // Actions
    updateSchemaName,
    addLabelMapping,
    addDescriptionMapping,
    addAliasMapping,
    removeLabelMapping,
    removeDescriptionMapping,
    removeAliasMapping,
    loadSchema,
    addStatement,
    addNewStatement,
    removeStatement,
    removeStatement1,
    updateStatement,
    updateStatement1,
    updateStatementById,
    updateStatementRank,
    updateStatementQualifiers,
    addQualifierToStatement,
    removeQualifierFromStatement,
    markAsSaved,
    markDirty,
    $reset,
    setLoading,
  }
})
