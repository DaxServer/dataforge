<script setup lang="ts">
interface WikibaseSchemaEditorEmits {
  'add-item': []
  preview: []
  save: []
  help: []
}

const emit = defineEmits<WikibaseSchemaEditorEmits>()

// Store instances
const schemaStore = useSchemaStore()
const dragDropStore = useDragDropStore()
const validationStore = useValidationStore()
const projectStore = useProjectStore()

// Composables
const { loadSchema } = useSchemaApi()
const { showError, showSuccess } = useErrorHandling()
const { convertProjectColumnsToColumnInfo } = useColumnConversion()
const { setAvailableColumns, initializeStatement, resetStatement } = useStatementEditor()

// Schema validation UI composable
const { enableAutoValidation, disableAutoValidation } = useSchemaValidationUI()

// Real-time validation composable
const { startRealTimeValidation, stopRealTimeValidation } = useRealTimeValidation()

// Schema persistence composable
const { saveSchema, canSave, isSaving, saveStatus } = useSchemaPersistence()

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
  qualifiers?: PropertyValueMap[]
}>({
  property: null,
  value: {
    type: 'column',
    source: {
      columnName: '',
      dataType: 'VARCHAR',
    },
    dataType: 'string',
  },
  rank: 'normal',
  qualifiers: [],
})

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
  // Enable real-time validation
  enableAutoValidation()
  startRealTimeValidation()
})

// Methods
const initializeEditor = async () => {
  try {
    // Initialize drag-drop available targets
    initializeDragDropTargets()

    // Load existing schema if schemaId is provided
    if (schemaStore.projectId && schemaStore.schemaId) {
      await loadSchema(schemaStore.projectId, schemaStore.schemaId)
    } else {
      // Initialize with default empty item structure for new schema
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
  const route = useRoute()
  schemaStore.projectId = route.params.id as UUID
  schemaStore.schemaName = 'Untitled Schema'
  schemaStore.wikibase = 'https://www.wikidata.org'
  // Don't set isDirty = true here - only when user makes actual changes
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
  const result = await saveSchema()

  if (result.success) {
    showSuccess(schemaStore.schemaId ? 'Schema saved successfully' : 'Schema created successfully')
    emit('save')
  } else {
    showError(
      createFrontendError(
        'UI_STATE_ERROR',
        typeof result.error === 'string'
          ? result.error
          : result.error?.message || 'Failed to save schema',
      ),
    )
  }
}

const handleHelp = () => {
  emit('help')
}

// Save button state helpers
const getSaveButtonLabel = () => {
  if (isSaving.value) return 'Saving...'
  if (saveStatus.value === 'success' && !schemaStore.isDirty) return 'Saved'
  if (saveStatus.value === 'error') return 'Save Failed'
  return 'Save'
}

const getSaveButtonIcon = () => {
  if (isSaving.value) return 'pi pi-spin pi-spinner'
  if (saveStatus.value === 'success' && !schemaStore.isDirty) return 'pi pi-check'
  if (saveStatus.value === 'error') return 'pi pi-times'
  return 'pi pi-save'
}

const getSaveButtonSeverity = () => {
  if (saveStatus.value === 'success' && !schemaStore.isDirty) return 'success'
  if (saveStatus.value === 'error') return 'danger'
  return undefined
}

const handleAddStatement = () => {
  // Reset statement editor to default state
  resetStatement()
  currentStatementWithQualifiers.value = {
    property: null,
    value: {
      type: 'column',
      source: {
        columnName: '',
        dataType: 'VARCHAR',
      },
      dataType: 'string',
    },
    rank: 'normal',
    qualifiers: [],
  }
  editingStatementId.value = null
  isAddingStatement.value = true
}

const handleEditStatement = (statementId: UUID) => {
  const statement = schemaStore.statements.find((s) => s.id === statementId)
  if (statement) {
    // Load existing statement data for editing including qualifiers
    currentStatementWithQualifiers.value = {
      property: statement.property,
      value: { ...statement.value },
      rank: statement.rank,
      qualifiers: [...(statement.qualifiers || [])],
    }
    initializeStatement({
      property: statement.property,
      value: { ...statement.value },
      rank: statement.rank,
    })
    editingStatementId.value = statementId
    isAddingStatement.value = false
  }
}

const handleRemoveStatement = (statementId: UUID) => {
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
  qualifiers?: PropertyValueMap[]
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
      const existingStatement = schemaStore.statements[statementIndex]
      if (existingStatement) {
        schemaStore.statements[statementIndex] = {
          id: existingStatement.id,
          property: currentStatement.property,
          value: currentStatement.value,
          rank: currentStatement.rank,
          qualifiers: currentStatement.qualifiers || [],
          references: existingStatement.references,
        }
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
  currentStatementWithQualifiers.value = {
    property: null,
    value: {
      type: 'column',
      source: {
        columnName: '',
        dataType: 'VARCHAR',
      },
      dataType: 'string',
    },
    rank: 'normal',
    qualifiers: [],
  }
  resetStatement()
}

// Cleanup
onUnmounted(() => {
  dragDropStore.$reset()
  // Disable real-time validation and clear errors
  disableAutoValidation()
  stopRealTimeValidation()
  validationStore.$reset()
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

          <!-- Validation status indicator -->
          <div
            v-if="validationStore.hasErrors || validationStore.hasWarnings"
            class="flex items-center gap-2 px-3 py-1 rounded-full text-sm"
            :class="[
              validationStore.hasErrors
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-yellow-50 border border-yellow-200 text-yellow-700',
            ]"
          >
            <i
              :class="[
                validationStore.hasErrors ? 'pi pi-times-circle' : 'pi pi-exclamation-triangle',
              ]"
            />
            <span>
              {{ validationStore.errorCount }}
              {{ validationStore.errorCount === 1 ? 'error' : 'errors' }}
              <span v-if="validationStore.hasWarnings">
                , {{ validationStore.warningCount }}
                {{ validationStore.warningCount === 1 ? 'warning' : 'warnings' }}
              </span>
            </span>
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
            :label="getSaveButtonLabel()"
            :icon="getSaveButtonIcon()"
            :severity="getSaveButtonSeverity()"
            outlined
            size="small"
            :disabled="!canSave || isSaving"
            :loading="isSaving"
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

      <!-- Validation Status Bar -->
      <div class="mb-4">
        <ValidationDisplay
          mode="status"
          :show-details="true"
          :show-clear-all="true"
        />
      </div>

      <!-- Detailed Validation Feedback -->
      <div
        v-if="validationStore.hasAnyIssues"
        class="mb-4"
      >
        <ValidationDisplay mode="full" />
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
                  :model-value="currentStatementWithQualifiers"
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
