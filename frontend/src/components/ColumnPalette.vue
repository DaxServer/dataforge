<script setup lang="ts">
const projectStore = useProjectStore()
const dragDropStore = useDragDropStore()

const { convertProjectColumnsToColumnInfo } = useColumnConversion()
const { formatDataTypeDisplayName, generateColumnTooltip, getDataTypeIcon, getDataTypeSeverity } =
  useColumnDataTypeIndicators()

const columns = computed(() => {
  return convertProjectColumnsToColumnInfo(projectStore.columns, projectStore.data)
})

const handleDragStart = (event: DragEvent, _column: ColumnInfo) => {
  if (!event.dataTransfer) return

  // Set column data in DataTransfer for drop zones to access
  event.dataTransfer.setData('application/x-column-data', JSON.stringify(_column))
  event.dataTransfer.setData('text/plain', _column.name) // Fallback

  // Set drag effect
  event.dataTransfer.effectAllowed = 'copy'

  // Set dragged column data in store
  dragDropStore.startDrag(_column)
}

const handleDragEnd = () => {
  // Clean up drag state
  dragDropStore.endDrag()
}

const formatSampleValues = (sampleValues: string[]) => {
  if (!sampleValues || sampleValues.length === 0) return ''

  const displayValues = sampleValues.slice(0, 2).join(', ')
  const hasMore = sampleValues.length > 2

  return `Sample: ${displayValues}${hasMore ? '...' : ''}`
}
</script>

<template>
  <div class="column-palette p-4">
    <div class="mb-4">
      <h3 class="text-lg font-semibold text-surface-900 mb-2">Data Columns</h3>
      <p class="text-sm text-surface-600">Drag columns to map them to Wikibase schema elements</p>
    </div>

    <!-- Empty state -->
    <div
      v-if="!columns || columns.length === 0"
      data-testid="empty-state"
      class="text-center py-8 px-4 border-2 border-dashed border-surface-300 rounded-lg"
    >
      <div class="text-surface-500 mb-2">
        <i class="pi pi-database text-3xl"></i>
      </div>
      <h4 class="text-surface-700 font-medium mb-2">No data columns available</h4>
      <p class="text-sm text-surface-600">Load a dataset to see available columns for mapping</p>
    </div>

    <!-- Column chips -->
    <div
      v-else
      class="flex flex-wrap gap-3"
    >
      <div
        v-for="col in columns"
        :key="col.name"
        :data-testid="'column-chip'"
        :class="{
          'opacity-50': dragDropStore.isDragging && dragDropStore.draggedColumn?.name === col.name,
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
            ></i>
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
            ></i>
          </div>

          <div
            v-if="col.sampleValues && col.sampleValues.length > 0"
            class="text-xs text-surface-600"
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
</template>
