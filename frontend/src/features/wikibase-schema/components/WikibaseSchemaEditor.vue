<script setup lang="ts">
import {
  LucideArrowLeft,
  LucideCheck,
  LucideEye,
  LucideHelpCircle,
  LucideLoader2,
  LucidePencil,
  LucidePlus,
  LucideSave,
  LucideTrash,
  LucideX,
} from 'lucide-vue-next'

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

// Composables
const { showError, showSuccess } = useErrorHandling()

// Schema selection workflow composable
const {
  isLoadingSchema,
  showSchemaSelector,
  showMainEditor,
  selectSchema,
  createNewSchema,
  backToSelector,
} = useSchemaSelection()

// Schema API composable
const { saveSchema, canSave, isSaving, saveStatus } = useSchemaApi()

// State
const isInitialized = ref(false)
const isConfiguringItem = ref(false)

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

// Lifecycle
onMounted(() => {
  initializeEditor()
})

// Methods
const initializeEditor = () => {
  try {
    // Initialize drag-drop available targets
    initializeDragDropTargets()

    // The schema selection workflow will handle loading schemas
    // No need to load schema here - it's handled by useSchemaSelection
    isInitialized.value = true
  } catch {
    showError([
      createFrontendError('SCHEMA_EDITOR_INIT_FAILED', 'Failed to initialize schema editor'),
    ])
  }
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
    showError([
      createFrontendError(
        'UI_STATE_ERROR',
        typeof result.error === 'string'
          ? result.error
          : result.error?.message || 'Failed to save schema',
      ),
    ])
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

const getSaveButtonVariant = () => {
  if (saveStatus.value === 'success' && !schemaStore.isDirty) return 'default'
  if (saveStatus.value === 'error') return 'destructive'
  return 'outline'
}

// Cleanup
onUnmounted(() => {
  dragDropStore.$reset()
  validationStore.$reset()
  isConfiguringItem.value = false
})
</script>

<template>
  <div>
    <!-- Schema Selector View -->
    <div v-if="showSchemaSelector">
      <SchemaSelector
        :on-schema-selected="selectSchema"
        :on-create-new="createNewSchema"
      />
    </div>

    <!-- Main Editor View -->
    <div
      v-else-if="showMainEditor"
      class="flex flex-col gap-6"
    >
      <!-- Column Palette Section -->
      <ColumnPalette />

      <!-- Schema Canvas Section -->
      <div class="flex-1 bg-white border border-surface-200 rounded-lg p-6 font-sans shadow-sm">
        <!-- Toolbar -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-4">
            <Button
              data-testid="back-to-selector-btn"
              size="icon"
              variant="ghost"
              aria-label="Back to schema selector"
              @click="backToSelector"
            >
              <LucideArrowLeft />
            </Button>
            <h1 class="text-xl font-semibold">{{ schemaTitle }}</h1>
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
              variant="outline"
              size="sm"
              :disabled="schemaStore.isLoading"
              @click="handleAddItem"
            >
              <LucidePlus />
              Add item
            </Button>
            <Button
              data-testid="preview-btn"
              variant="outline"
              size="sm"
              :disabled="schemaStore.isLoading"
              @click="handlePreview"
            >
              <LucideEye />
              Preview
            </Button>
            <Button
              data-testid="save-btn"
              :variant="getSaveButtonVariant()"
              :disabled="!canSave || isSaving"
              size="sm"
              @click="handleSave"
            >
              <LucideLoader2 v-if="isSaving" class="animate-spin" />
              <LucideCheck v-else-if="saveStatus === 'success' && !schemaStore.isDirty" />
              <LucideX v-else-if="saveStatus === 'error'" />
              <LucideSave v-else />
              {{ getSaveButtonLabel() }}
            </Button>
            <Button
              data-testid="help-btn"
              variant="outline"
              size="sm"
              @click="handleHelp"
            >
              <LucideHelpCircle />
              Help
            </Button>
          </div>
        </div>

        <!-- Validation Status Bar -->
        <ValidationDisplay
          mode="status"
          :show-details="true"
          :show-clear-all="true"
        />

        <!-- Schema Content -->
        <div class="py-4">
          <!-- Empty State -->
          <div
            v-if="!hasItem && isInitialized"
            class="text-center py-12"
          >
            <div class="text-gray-500 mb-4">
              <i class="pi pi-box text-4xl" />
            </div>
            <h3 class="text-lg font-medium text-gray-700 mb-2">No item configured</h3>
            <p class="text-gray-500 mb-4">
              Start by adding an item to define your Wikibase schema structure.
            </p>
            <Button @click="handleAddItem">
              <LucidePlus />
              Add your first item
            </Button>
          </div>

          <!-- Item Configuration (when item exists) -->
          <div v-else-if="hasItem">
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
                  <Button size="sm">
                    <LucidePencil />
                    Edit item
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                  >
                    <LucideTrash />
                    Delete item
                  </Button>
                </div>
              </div>

              <!-- Terms Editor Integration -->
              <TermsEditor />

              <!-- Statement Manager Integration -->
              <div class="mt-6">
                <StatementManager />
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

    <!-- Loading State -->
    <div
      v-else-if="isLoadingSchema"
      class="flex items-center justify-center py-12"
    >
      <ProgressSpinner
        stroke-width="4"
        animation-duration="1s"
      />
      <span class="ml-3 text-surface-600">Loading schema...</span>
    </div>
  </div>
</template>
