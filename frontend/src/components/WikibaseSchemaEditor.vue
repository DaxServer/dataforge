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

// Composables
const { loadSchema, createSchema, updateSchema } = useSchemaApi()
const { showError, showSuccess } = useErrorHandling()

// Reactive state
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

const canSave = computed(() => {
  return schemaStore.isDirty && !schemaStore.isLoading
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
    showError({
      errors: [
        {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to initialize schema editor',
        },
      ],
    })
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
    showError({
      errors: [
        {
          code: 'DATABASE_ERROR',
          message: 'Failed to save schema',
        },
      ],
    })
  }

  emit('save')
}

const handleHelp = () => {
  emit('help')
}

// Cleanup
onUnmounted(() => {
  dragDropStore.$reset()
  validationStore.clearAll()
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
            <i class="pi pi-spin pi-spinner text-gray-500"></i>
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
          v-if="!hasItem && isInitialized"
          class="empty-item-placeholder text-center py-12"
        >
          <div class="text-gray-500 mb-4">
            <i class="pi pi-box text-4xl"></i>
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
          <!-- This will be replaced by ItemEditor component in future tasks -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-2">
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

            <!-- Terms Section -->
            <div class="pl-4 mb-2">
              <div class="mb-1">
                <span class="font-medium">Labels:</span>
                <span
                  v-if="Object.keys(schemaStore.labels).length > 0"
                  class="ml-2 text-gray-700"
                >
                  {{
                    Object.entries(schemaStore.labels)
                      .map(([lang, mapping]) => `${mapping.columnName} (${lang})`)
                      .join(', ')
                  }}
                </span>
                <span
                  v-else
                  class="ml-2 text-gray-400 italic"
                >
                  No labels configured
                </span>
              </div>
              <div>
                <span class="font-medium">Descriptions:</span>
                <span
                  v-if="Object.keys(schemaStore.descriptions).length > 0"
                  class="ml-2 text-gray-700"
                >
                  {{
                    Object.entries(schemaStore.descriptions)
                      .map(([lang, mapping]) => `${mapping.columnName} (${lang})`)
                      .join(', ')
                  }}
                </span>
                <span
                  v-else
                  class="ml-2 text-gray-400 italic"
                >
                  No descriptions configured
                </span>
              </div>
            </div>

            <!-- Statements Section -->
            <div class="pl-4">
              <div class="font-medium mb-1">Statements</div>
              <div v-if="schemaStore.statements.length > 0">
                <div
                  v-for="statement in schemaStore.statements"
                  :key="statement.id"
                  class="flex items-center mb-1"
                >
                  <span class="text-blue-700 font-medium mr-2">
                    {{ statement.property.id }} ({{
                      statement.property.label || 'Unknown property'
                    }})
                  </span>
                  <span class="text-gray-800 mr-2">
                    {{
                      typeof statement.value.source === 'string'
                        ? statement.value.source
                        : statement.value.source.columnName || 'No mapping'
                    }}
                  </span>
                  <Button
                    icon="pi pi-pencil"
                    rounded
                    text
                    size="small"
                    aria-label="Edit statement"
                  />
                  <Button
                    icon="pi pi-trash"
                    rounded
                    text
                    severity="danger"
                    size="small"
                    aria-label="Delete statement"
                  />
                </div>
              </div>
              <div
                v-else
                class="text-gray-400 italic"
              >
                No statements configured
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div
          v-else-if="!isInitialized"
          class="text-center py-12"
        >
          <i class="pi pi-spin pi-spinner text-2xl text-gray-500"></i>
          <p class="text-gray-500 mt-2">Loading schema editor...</p>
        </div>
      </div>
    </div>
  </div>
</template>
