<script setup lang="ts">
interface ItemEditorEmits {
  'edit-item': []
  'delete-item': []
  'item-created': [itemId: string]
}

const emit = defineEmits<ItemEditorEmits>()

// Store instances
const schemaStore = useSchemaStore()

// Internal state
const internalItemId = ref<string>('')
const wasConfigured = ref(false)

// Computed properties
const hasItem = computed(() => {
  return (
    schemaStore.itemId !== null ||
    Object.keys(schemaStore.labels).length > 0 ||
    Object.keys(schemaStore.descriptions).length > 0 ||
    schemaStore.statements.length > 0
  )
})

const itemHeaderText = computed(() => {
  return schemaStore.itemId
    ? `Item ${schemaStore.itemId}`
    : 'New Item (not yet created in Wikibase)'
})

const labelsDisplayText = computed(() => {
  const entries = Object.entries(schemaStore.labels1)
  if (entries.length === 0) return 'No labels configured'

  return entries.map(([lang, mapping]) => `${mapping.columnName} (${lang})`).join(', ')
})

const descriptionsDisplayText = computed(() => {
  const entries = Object.entries(schemaStore.descriptions)
  if (entries.length === 0) return 'No descriptions configured'

  return entries.map(([lang, mapping]) => `${mapping.columnName} (${lang})`).join(', ')
})

const aliasesDisplayText = computed(() => {
  const entries = Object.entries(schemaStore.aliases)
  if (entries.length === 0) return 'No aliases configured'

  return entries
    .map(([lang, mappings]) =>
      mappings.map((mapping) => `${mapping.columnName} (${lang})`).join(', '),
    )
    .join(', ')
})

const statementsDisplayText = computed(() => {
  return schemaStore.statements.length === 0
    ? 'No statements configured'
    : `${schemaStore.statements.length} statements`
})

// Watchers
watch(
  hasItem,
  (newHasItem, oldHasItem) => {
    // Emit item-created when item configuration is first added
    if (newHasItem && !oldHasItem && !schemaStore.itemId && !wasConfigured.value) {
      emit('item-created', internalItemId.value)
      wasConfigured.value = true
    }
  },
  { immediate: false },
)

// Lifecycle
onMounted(() => {
  // Generate unique internal ID for this item configuration
  internalItemId.value = `item-${crypto.randomUUID()}`

  // Check if already configured
  wasConfigured.value = hasItem.value
})

// Event handlers
const handleEditItem = () => {
  emit('edit-item')
}

const handleDeleteItem = () => {
  emit('delete-item')
}

const formatStatementValue = (statement: any) => {
  const valueSource = statement.value.source
  return typeof valueSource === 'string'
    ? valueSource
    : (valueSource as ColumnMapping)?.columnName || 'No mapping'
}
</script>

<template>
  <div
    v-if="hasItem"
    data-testid="item-editor"
    class="item-editor mb-6"
  >
    <!-- Item Header -->
    <div
      data-testid="item-header"
      class="item-header flex items-center justify-between mb-2"
    >
      <span class="font-medium text-lg">
        {{ itemHeaderText }}
      </span>
      <div class="flex gap-2">
        <Button
          data-testid="edit-item-btn"
          icon="pi pi-pencil"
          rounded
          text
          size="small"
          aria-label="Edit item"
          @click="handleEditItem"
        />
        <Button
          data-testid="delete-item-btn"
          icon="pi pi-trash"
          rounded
          text
          severity="danger"
          size="small"
          aria-label="Delete item"
          @click="handleDeleteItem"
        />
      </div>
    </div>

    <!-- Terms Section -->
    <div
      data-testid="terms-section"
      class="terms-section pl-4 mb-2"
    >
      <div class="mb-1">
        <span class="font-medium">Labels:</span>
        <span
          data-testid="labels-display"
          :class="
            Object.keys(schemaStore.labels).length > 0
              ? 'ml-2 text-gray-700'
              : 'ml-2 text-gray-400 italic'
          "
        >
          {{ labelsDisplayText }}
        </span>
      </div>
      <div class="mb-1">
        <span class="font-medium">Descriptions:</span>
        <span
          data-testid="descriptions-display"
          :class="
            Object.keys(schemaStore.descriptions).length > 0
              ? 'ml-2 text-gray-700'
              : 'ml-2 text-gray-400 italic'
          "
        >
          {{ descriptionsDisplayText }}
        </span>
      </div>
      <div>
        <span class="font-medium">Aliases:</span>
        <span
          data-testid="aliases-display"
          :class="
            Object.keys(schemaStore.aliases).length > 0
              ? 'ml-2 text-gray-700'
              : 'ml-2 text-gray-400 italic'
          "
        >
          {{ aliasesDisplayText }}
        </span>
      </div>
    </div>

    <!-- Statements Section -->
    <div
      data-testid="statements-section"
      class="statements-section pl-4"
    >
      <div class="font-medium mb-1">Statements</div>
      <div
        v-if="schemaStore.statements.length > 0"
        data-testid="statements-list"
      >
        <div
          v-for="statement in schemaStore.statements"
          :key="statement.id"
          class="flex items-center mb-1"
        >
          <span class="text-blue-700 font-medium mr-2">
            {{ statement.property.id }} ({{ statement.property.label || 'Unknown property' }})
          </span>
          <span class="text-gray-800 mr-2">
            {{ formatStatementValue(statement) }}
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
        data-testid="statements-display"
        class="text-gray-400 italic"
      >
        {{ statementsDisplayText }}
      </div>
    </div>
  </div>
</template>
