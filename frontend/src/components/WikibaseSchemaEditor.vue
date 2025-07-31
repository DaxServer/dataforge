<script setup lang="ts">
interface WikibaseSchemaEditorProps {
  projectId?: string
  schemaId?: string
}

interface WikibaseSchemaEditorEmits {
  'add-item': []
  preview: []
  save: []
  help: []
}

const props = withDefaults(defineProps<WikibaseSchemaEditorProps>(), {
  projectId: '',
  schemaId: '',
})

const emit = defineEmits<WikibaseSchemaEditorEmits>()

// Store instances
const schemaStore = useSchemaStore()
const dragDropStore = useDragDropStore()
const validationStore = useValidationStore()
const projectStore = useProjectStore()

// Composables
const { loadSchema, createSchema, updateSchema } = useSchemaApi()
const { showError, showSuccess } = useErrorHandling()
const { convertProjectColumnsToColumnInfo } = useColumnConversion()
const { localStatement, setAvailableColumns, initializeStatement, resetStatement } =
  useStatementEditor()

// Reactive state
const isInitialized = ref(false)
const isConfiguringItem = ref(false)
const isAddingStatement = ref(false)
const editingStatementId = ref<string | null>(null)

// Local statement state with qualifiers
const currentStatementWithQualifiers = ref<{
  property: PropertyReference | null
  value: ValueMapping
  rank: StatementRank
  qualifiers?: QualifierSchemaMapping[]
} | null>(null)

// Computed properties
const schemaTitle = computed(() => {
  return schemaStore.schemaName || 'Wikibase Schema'
})

const hasItem = computed(() => {
  // An item exists if we have a valid Wikibase ItemId, any configuration, or are actively configuring
  return (
    schemaStore.itemId !== null ||
    Object.keys(schemaStore.labels).length > 0 ||
    Object.keys(schemaStore.descriptions).length > 0 ||
    schemaStore.statements.length > 0 ||
    isConfiguringItem.value
  )
})

const canSave = computed(() => {
  return schemaStore.isDirty && !schemaStore.isLoading
})

// Available columns for statement editor
const availableColumns = computed(() => {
  const columns = convertProjectColumnsToColumnInfo(projectStore.columns, projectStore.data)
  // Update the composable with available columns
  setAvailableColumns(columns)
  return columns
})

// Check if we're in statement editing mode
const isEditingStatement = computed(() => {
  return isAddingStatement.value || editingStatementId.value !== null
})

// Lifecycle
onMounted(async () => {
  await initializeEditor()
})

// Methods
const initializeEditor = async () => {
  try {
    // Initialize drag-drop available targets
    initializeDragDropTargets()

    // Load existing schema if schemaId is provided
    if (props.projectId && props.schemaId) {
      await loadSchema(props.projectId, props.schemaId)
    } else if (props.projectId) {
      // Initialize with default empty item structure
      initializeEmptySchema()
    }

    isInitialized.value = true
  } catch (error) {
    showError(
      createFrontendError('SCHEMA_EDITOR_INIT_FAILED', 'Failed to initialize schema editor'),
    )
  }
}

const initializeEmptySchema = () => {
  schemaStore.projectId = props.projectId
  schemaStore.schemaName = 'Untitled Schema'
  schemaStore.wikibase = 'https://www.wikidata.org'
  // Item will be created when user clicks "Add item"
}

const initializeDragDropTargets = () => {
  // Set up available drop targets for drag-and-drop operations
  const targets = [
    {
      type: 'label' as const,
      path: 'item.terms.labels.en',
      acceptedTypes: ['string' as const],
      language: 'en',
      isRequired: false,
    },
    {
      type: 'description' as const,
      path: 'item.terms.descriptions.en',
      acceptedTypes: ['string' as const],
      language: 'en',
      isRequired: false,
    },
    {
      type: 'alias' as const,
      path: 'item.terms.aliases.en',
      acceptedTypes: ['string' as const],
      language: 'en',
      isRequired: false,
    },
  ]

  dragDropStore.setAvailableTargets(targets)
}

// Event handlers
const handleAddItem = () => {
  if (!hasItem.value) {
    // Start configuring a new item - ItemId will remain null until item is created in Wikibase
    isConfiguringItem.value = true
    schemaStore.isDirty = true
  }
  emit('add-item')
}

const handlePreview = () => {
  emit('preview')
}

const handleSave = async () => {
  if (!canSave.value) return

  try {
    if (schemaStore.schemaId) {
      // Update existing schema
      await updateSchema(props.projectId, schemaStore.schemaId, {
        id: schemaStore.schemaId,
        projectId: schemaStore.projectId,
        name: schemaStore.schemaName,
        wikibase: schemaStore.wikibase,
        item: {
          id: schemaStore.itemId ?? undefined,
          terms: {
            labels: schemaStore.labels,
            descriptions: schemaStore.descriptions,
            aliases: schemaStore.aliases,
          },
          statements: schemaStore.statements,
        },
        createdAt: schemaStore.createdAt,
        updatedAt: new Date().toISOString(),
      })
    } else {
      // Create new schema
      await createSchema(props.projectId, {
        name: schemaStore.schemaName,
        wikibase: schemaStore.wikibase,
      })
    }

    showSuccess('Schema saved successfully')
  } catch (error) {
    showError(createFrontendError('UI_STATE_ERROR', 'Failed to save schema'))
  }

  emit('save')
}

const handleHelp = () => {
  emit('help')
}

const handleAddStatement = () => {
  // Reset statement editor to default state
  resetStatement()
  editingStatementId.value = null
  isAddingStatement.value = true
}

const handleEditStatement = (statementId: string) => {
  const statement = schemaStore.statements.find((s) => s.id === statementId)
  if (statement) {
    // Load existing statement data for editing
    initializeStatement({
      property: statement.property,
      value: { ...statement.value },
      rank: statement.rank,
    })
    editingStatementId.value = statementId
    isAddingStatement.value = false
  }
}

const handleRemoveStatement = (statementId: string) => {
  schemaStore.removeStatement(statementId)
}

const handleReorderStatements = (fromIndex: number, toIndex: number) => {
  // TODO: Implement reorder logic in schema store
  console.log('Reorder statements from', fromIndex, 'to', toIndex)
}

// Statement editor event handlers
const handleStatementUpdate = (statement: {
  property: PropertyReference | null
  value: ValueMapping
  rank: StatementRank
  qualifiers?: QualifierSchemaMapping[]
}) => {
  currentStatementWithQualifiers.value = statement
  // Also update the composable state for backward compatibility
  initializeStatement({
    property: statement.property,
    value: statement.value,
    rank: statement.rank,
  })
}

const handleStatementSave = () => {
  const currentStatement = currentStatementWithQualifiers.value
  if (!currentStatement?.property) return

  if (editingStatementId.value) {
    // Update existing statement
    const statementIndex = schemaStore.statements.findIndex(
      (s) => s.id === editingStatementId.value,
    )
    if (statementIndex !== -1) {
      schemaStore.statements[statementIndex] = {
        ...schemaStore.statements[statementIndex],
        property: currentStatement.property,
        value: currentStatement.value,
        rank: currentStatement.rank,
        qualifiers: currentStatement.qualifiers || [],
      }
    }
  } else {
    // Add new statement
    schemaStore.addStatement(
      currentStatement.property,
      currentStatement.value,
      currentStatement.rank,
      currentStatement.qualifiers || [],
    )
  }

  // Close statement editor
  handleCancelStatementEdit()
}

const handleCancelStatementEdit = () => {
  isAddingStatement.value = false
  editingStatementId.value = null
  currentStatementWithQualifiers.value = null
  resetStatement()
}

// Cleanup
onUnmounted(() => {
  dragDropStore.$reset()
  // Clear validation errors when clearing schema
  // validationStore.clearAll() // Method not available in current store
  isConfiguringItem.value = false
})
</script>

<template>
  <div class="schema-editor-container flex gap-6">
    <!-- Column Palette Section -->
    <div class="column-palette-section w-80 flex-shrink-0">
      <ColumnPalette />
    </div>

    <!-- Schema Canvas Section -->
    <div class="schema-canvas-section flex-1 bg-gray-50 rounded-lg shadow p-8 font-sans">
      <!-- Toolbar -->
      <div class="schema-toolbar flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <h1 class="schema-title text-xl font-semibold">{{ schemaTitle }}</h1>
          <div
            v-if="schemaStore.isLoading"
            class="toolbar-loading"
          >
            <i class="pi pi-spin pi-spinner text-gray-500" />
          </div>
        </div>

        <div class="flex gap-2">
          <Button
            data-testid="add-item-btn"
            label="Add item"
            icon="pi pi-plus"
            outlined
            size="small"
            :disabled="schemaStore.isLoading"
            @click="handleAddItem"
          />
          <Button
            data-testid="preview-btn"
            label="Preview"
            icon="pi pi-eye"
            outlined
            size="small"
            :disabled="schemaStore.isLoading"
            @click="handlePreview"
          />
          <Button
            data-testid="save-btn"
            label="Save"
            icon="pi pi-save"
            outlined
            size="small"
            :disabled="!canSave"
            @click="handleSave"
          />
          <Button
            data-testid="help-btn"
            label="Help"
            icon="pi pi-question-circle"
            outlined
            size="small"
            @click="handleHelp"
          />
        </div>
      </div>

      <!-- Validation Feedback -->
      <div
        v-if="validationStore.hasAnyIssues"
        class="mb-4"
      >
        <ValidationErrorDisplay />
      </div>

      <!-- Schema Content -->
      <div class="bg-white rounded-md p-6 shadow-sm">
        <!-- Empty State -->
        <div
          v-if="!hasItem && isInitialized && !isAddingStatement"
          class="empty-item-placeholder text-center py-12"
        >
          <div class="text-gray-500 mb-4">
            <i class="pi pi-box text-4xl" />
          </div>
          <h3 class="text-lg font-medium text-gray-700 mb-2">No item configured</h3>
          <p class="text-gray-500 mb-4">
            Start by adding an item to define your Wikibase schema structure.
          </p>
          <Button
            label="Add your first item"
            icon="pi pi-plus"
            @click="handleAddItem"
          />
        </div>

        <!-- Item Configuration (when item exists) -->
        <div
          v-else-if="hasItem"
          class="item-configuration"
        >
          <div class="mb-6">
            <div class="flex items-center justify-between mb-4">
              <span class="font-medium text-lg">
                {{
                  schemaStore.itemId
                    ? `Item ${schemaStore.itemId}`
                    : 'New Item (not yet created in Wikibase)'
                }}
              </span>
              <div class="flex gap-2">
                <Button
                  icon="pi pi-pencil"
                  rounded
                  text
                  size="small"
                  aria-label="Edit item"
                />
                <Button
                  icon="pi pi-trash"
                  rounded
                  text
                  severity="danger"
                  size="small"
                  aria-label="Delete item"
                />
              </div>
            </div>

            <!-- Terms Editor Integration -->
            <TermsEditor />

            <!-- Statements Editor Integration -->
            <div class="mt-6">
              <StatementsEditor
                :is-adding-statement="isAddingStatement"
                @add-statement="handleAddStatement"
                @edit-statement="handleEditStatement"
                @remove-statement="handleRemoveStatement"
                @reorder-statements="handleReorderStatements"
              />

              <!-- Statement Editor (only visible when adding/editing) -->
              <div
                v-if="isEditingStatement"
                class="mt-6"
              >
                <StatementEditor
                  :model-value="localStatement"
                  :available-columns="availableColumns"
                  @update:model-value="handleStatementUpdate"
                  @save="handleStatementSave"
                  @cancel="handleCancelStatementEdit"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div
          v-else-if="!isInitialized"
          class="text-center py-12"
        >
          <i class="pi pi-spin pi-spinner text-2xl text-gray-500" />
          <p class="text-gray-500 mt-2">Loading schema editor...</p>
        </div>
      </div>
    </div>
  </div>
</template>
