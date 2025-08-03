import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ColumnInfo } from '@frontend/shared/types/wikibase-schema'
import type { DragState, DropTarget } from '@frontend/shared/types/drag-drop'
import { useDataTypeCompatibility } from '@frontend/features/data-processing/composables/useDataTypeCompatibility'

/**
 * Pinia store for managing global drag and drop state in the schema editor
 */
export const useDragDropStore = defineStore('dragDrop', () => {
  const { getCompatibleWikibaseTypes } = useDataTypeCompatibility()

  // Core reactive state
  const draggedColumn = ref<ColumnInfo | null>(null)
  const dragState = ref<DragState>('idle')
  const validDropTargets = ref<string[]>([])
  const hoveredTarget = ref<string | null>(null)

  // Available drop targets (populated from schema configuration)
  const availableTargets = ref<DropTarget[]>([])

  // Computed properties
  const isDragging = computed(() => dragState.value === 'dragging')
  const isDropping = computed(() => dragState.value === 'dropping')
  const hasValidTargets = computed(() => validDropTargets.value.length > 0)

  // Computed property for valid drop targets as objects
  const validDropTargetsAsObjects = computed(() => {
    if (!draggedColumn.value) return []
    return availableTargets.value.filter((target) => validDropTargets.value.includes(target.path))
  })

  // Computed property to check if current drop is valid
  const isValidDrop = computed(() => {
    if (!draggedColumn.value || !hoveredTarget.value) return false
    const target = availableTargets.value.find((t) => t.path === hoveredTarget.value)
    if (!target) return false

    // Use the shared compatibility mapping
    const compatibleTypes = getCompatibleWikibaseTypes(draggedColumn.value.dataType)
    const isCompatible = target.acceptedTypes.some((type) => compatibleTypes.includes(type))

    if (!isCompatible) return false
    if (target.isRequired && draggedColumn.value.nullable) return false

    // Additional validation based on target type
    switch (target.type) {
      case 'label':
      case 'alias': {
        const maxLength = target.type === 'label' ? 250 : 100
        const hasLongValues = draggedColumn.value.sampleValues?.some(
          (val) => val.length > maxLength,
        )
        if (hasLongValues) return false
        break
      }
      case 'statement':
      case 'qualifier':
      case 'reference': {
        if (!target.propertyId) return false
        break
      }
    }

    return true
  })

  // Actions
  const startDrag = (columnInfo: ColumnInfo) => {
    draggedColumn.value = columnInfo
    dragState.value = 'dragging'
    // Calculate valid drop targets based on column data type
    validDropTargets.value = calculateValidTargets(columnInfo)
  }

  const endDrag = () => {
    draggedColumn.value = null
    dragState.value = 'idle'
    validDropTargets.value = []
    hoveredTarget.value = null
  }

  const setHoveredTarget = (targetPath: string | null) => {
    hoveredTarget.value = targetPath
  }

  const setDragState = (state: DragState) => {
    dragState.value = state
  }

  const setAvailableTargets = (targets: DropTarget[]) => {
    availableTargets.value = targets
  }

  // Helper function to calculate valid drop targets for a column
  const calculateValidTargets = (columnInfo: ColumnInfo): string[] => {
    if (!columnInfo) return []

    const compatibleTypes = getCompatibleWikibaseTypes(columnInfo.dataType)

    return availableTargets.value
      .filter((target) => {
        // Check data type compatibility
        const isCompatible = target.acceptedTypes.some((type) => compatibleTypes.includes(type))
        if (!isCompatible) return false

        // Check nullable constraints
        if (target.isRequired && columnInfo.nullable) return false

        // Additional validation based on target type
        switch (target.type) {
          case 'label':
          case 'alias': {
            // Check for reasonable length constraints
            const maxLength = target.type === 'label' ? 250 : 100
            const hasLongValues = columnInfo.sampleValues?.some((val) => val.length > maxLength)
            if (hasLongValues) return false
            break
          }

          case 'statement':
          case 'qualifier':
          case 'reference': {
            // These require property IDs
            if (!target.propertyId) return false
            break
          }
        }

        return true
      })
      .map((target) => target.path)
  }

  // Reset store state
  const $reset = () => {
    draggedColumn.value = null
    dragState.value = 'idle'
    validDropTargets.value = []
    hoveredTarget.value = null
    availableTargets.value = []
  }

  // Method to get valid targets for a specific column
  const getValidTargetsForColumn = (columnInfo: ColumnInfo): DropTarget[] => {
    const validPaths = calculateValidTargets(columnInfo)
    return availableTargets.value.filter((target) => validPaths.includes(target.path))
  }

  return {
    // State for external consumption
    draggedColumn,
    dragState,
    validDropTargets,
    hoveredTarget,
    availableTargets,

    // Computed properties
    isDragging,
    isDropping,
    hasValidTargets,
    validDropTargetsAsObjects,
    isValidDrop,

    // Actions
    startDrag,
    endDrag,
    setHoveredTarget,
    setDragState,
    setAvailableTargets,
    getValidTargetsForColumn,
    $reset,
  }
})
