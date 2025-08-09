<script setup lang="ts">
const projectStore = useProjectStore()
const dragDropStore = useDragDropStore()

const { convertProjectColumnsToColumnInfo } = useColumnConversion()
const { formatDataTypeDisplayName, generateColumnTooltip, getDataTypeIcon, getDataTypeSeverity } =
  useColumnDataTypeIndicators()

// Import validation composable for dragstart validation
const { triggerDragStartValidation } = useValidation()

// Sample data visibility state (hidden by default)
const showSampleData = ref(false)

const dataColumns = computed(() => {
  return convertProjectColumnsToColumnInfo(projectStore.columns, projectStore.data)
})

const handleDragStart = (event: DragEvent, dataCol: ColumnInfo) => {
  if (!event.dataTransfer) return

  // Set column data in DataTransfer for drop zones to access
  event.dataTransfer.setData('application/x-column-data', JSON.stringify(dataCol))
  event.dataTransfer.setData('text/plain', dataCol.name) // Fallback

  // Set drag effect
  event.dataTransfer.effectAllowed = 'copy'

  // Set dragged column data in store first
  dragDropStore.startDrag(dataCol)

  // Then trigger validation immediately on dragstart event
  // This ensures validation is always active and triggers synchronously
  triggerDragStartValidation(dataCol)
}

const handleDragEnd = () => {
  // Clean up drag state
  dragDropStore.endDrag()
}

const formatSampleValues = (sampleValues: string[]) => {
  if (!sampleValues || sampleValues.length === 0) return ''

  const displayValues = sampleValues.slice(0, 3).join(', ')
  const hasMore = sampleValues.length > 3

  return `Sample: ${displayValues}${hasMore ? '...' : ''}`
}
</script>

<template>
  <div class="column-palette h-full p-4">
    <!-- Header with toggle switch -->
    <div class="flex justify-between items-center mb-4">
      <div>
        <h3 class="text-lg font-semibold text-surface-900 mb-1">Data Columns</h3>
      </div>
      <div class="flex items-center gap-2">
        <label
          for="sample-toggle"
          class="text-sm font-medium text-surface-700"
        >
          Show Samples
        </label>
        <ToggleSwitch
          id="sample-toggle"
          v-model="showSampleData"
          data-testid="sample-toggle-switch"
        />
      </div>
    </div>

    <!-- Content Area -->
    <div>
      <!-- Column chips -->
      <div class="flex flex-wrap gap-3">
        <div
          v-for="col in dataColumns"
          :key="col.name"
          :data-testid="'column-chip'"
          :class="{
            'opacity-50':
              dragDropStore.isDragging && dragDropStore.draggedColumn?.name === col.name,
            'cursor-grab': !dragDropStore.isDragging,
            'cursor-grabbing':
              dragDropStore.isDragging && dragDropStore.draggedColumn?.name === col.name,
          }"
          class="column-chip transition-opacity duration-200 hover:-translate-y-0.5 active:translate-y-0"
          draggable="true"
          @dragstart="handleDragStart($event, col)"
          @dragend="handleDragEnd"
        >
          <div
            class="bg-white border border-surface-300 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
            :title="generateColumnTooltip(col)"
          >
            <div class="flex items-center gap-2 mb-2">
              <i
                :class="getDataTypeIcon(col.dataType)"
                class="text-surface-600 text-sm"
                :title="`${formatDataTypeDisplayName(col.dataType)} column`"
              />
              <span class="font-medium text-surface-900">{{ col.name }}</span>
              <Chip
                :label="formatDataTypeDisplayName(col.dataType)"
                size="small"
                :severity="getDataTypeSeverity(col.dataType)"
                class="text-xs"
                :title="`Database type: ${col.dataType}`"
              />
              <i
                v-if="col.nullable"
                class="pi pi-question-circle text-surface-400 text-xs"
                title="This column allows null values"
              />
            </div>

            <div
              v-if="showSampleData && col.sampleValues && col.sampleValues.length > 0"
              class="text-xs text-surface-600"
              data-testid="sample-values"
              :title="`Sample values: ${col.sampleValues.slice(0, 5).join(', ')}${col.sampleValues.length > 5 ? '...' : ''}`"
            >
              {{ formatSampleValues(col.sampleValues) }}
            </div>

            <div
              v-if="col.uniqueCount !== undefined"
              class="text-xs text-surface-500 mt-1"
              :title="`This column has ${col.uniqueCount.toLocaleString()} unique values`"
            >
              {{ col.uniqueCount.toLocaleString() }} unique values
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
