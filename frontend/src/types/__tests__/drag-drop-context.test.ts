import { describe, it, expect, beforeEach } from 'bun:test'
import { ref, computed } from 'vue'
import type {
  SchemaDragDropContext,
  DropTarget,
  DropFeedback,
  DragState,
  DropValidation,
  DragEventData,
  DropEventData,
  DragVisualState,
} from '@frontend/types/drag-drop'
import type { ColumnInfo } from '@frontend/types/schema-mapping'

describe('Drag and Drop Context Types', () => {
  let mockColumnInfo: ColumnInfo
  let mockDropTarget: DropTarget

  beforeEach(() => {
    mockColumnInfo = {
      name: 'test_column',
      dataType: 'VARCHAR',
      sampleValues: ['value1', 'value2'],
      nullable: false,
      uniqueCount: 100,
    }

    mockDropTarget = {
      type: 'label',
      path: 'item.terms.labels.en',
      acceptedTypes: ['string'],
      language: 'en',
      isRequired: false,
    }
  })

  describe('SchemaDragDropContext', () => {
    it('should create a valid schema drag drop context', () => {
      const draggedColumn = ref<ColumnInfo | null>(null)
      const dragState = ref<DragState>('idle')
      const isOverDropZone = ref(false)
      const hoveredTarget = ref<string | null>(null)
      const validDropTargets = computed(() => [] as DropTarget[])
      const isValidDrop = computed(() => false)
      const dropFeedback = ref<DropFeedback | null>(null)

      const context: SchemaDragDropContext = {
        draggedColumn,
        dragState,
        isOverDropZone,
        hoveredTarget,
        validDropTargets,
        isValidDrop,
        dropFeedback,
      }

      expect(context.draggedColumn.value).toBeNull()
      expect(context.dragState.value).toBe('idle')
      expect(context.isOverDropZone.value).toBe(false)
      expect(context.hoveredTarget.value).toBeNull()
      expect(context.validDropTargets.value).toEqual([])
      expect(context.isValidDrop.value).toBe(false)
      expect(context.dropFeedback.value).toBeNull()
    })

    it('should handle drag state changes', () => {
      const draggedColumn = ref<ColumnInfo | null>(null)
      const dragState = ref<DragState>('idle')
      const isOverDropZone = ref(false)
      const hoveredTarget = ref<string | null>(null)
      const validDropTargets = computed(() => [] as DropTarget[])
      const isValidDrop = computed(() => false)
      const dropFeedback = ref<DropFeedback | null>(null)

      const context: SchemaDragDropContext = {
        draggedColumn,
        dragState,
        isOverDropZone,
        hoveredTarget,
        validDropTargets,
        isValidDrop,
        dropFeedback,
      }

      // Start drag operation
      context.draggedColumn.value = mockColumnInfo
      context.dragState.value = 'dragging'

      expect(context.draggedColumn.value).toEqual(mockColumnInfo)
      expect(context.dragState.value).toBe('dragging')

      // End drag operation
      context.draggedColumn.value = null
      context.dragState.value = 'idle'

      expect(context.draggedColumn.value).toBeNull()
      expect(context.dragState.value).toBe('idle')
    })

    it('should handle drop zone hover states', () => {
      const draggedColumn = ref<ColumnInfo | null>(null)
      const dragState = ref<DragState>('idle')
      const isOverDropZone = ref(false)
      const hoveredTarget = ref<string | null>(null)
      const validDropTargets = computed(() => [] as DropTarget[])
      const isValidDrop = computed(() => false)
      const dropFeedback = ref<DropFeedback | null>(null)

      const context: SchemaDragDropContext = {
        draggedColumn,
        dragState,
        isOverDropZone,
        hoveredTarget,
        validDropTargets,
        isValidDrop,
        dropFeedback,
      }

      // Enter drop zone
      context.isOverDropZone.value = true
      context.hoveredTarget.value = 'item.terms.labels.en'

      expect(context.isOverDropZone.value).toBe(true)
      expect(context.hoveredTarget.value).toBe('item.terms.labels.en')

      // Leave drop zone
      context.isOverDropZone.value = false
      context.hoveredTarget.value = null

      expect(context.isOverDropZone.value).toBe(false)
      expect(context.hoveredTarget.value).toBeNull()
    })

    it('should handle validation feedback', () => {
      const draggedColumn = ref<ColumnInfo | null>(null)
      const dragState = ref<DragState>('idle')
      const isOverDropZone = ref(false)
      const hoveredTarget = ref<string | null>(null)
      const validDropTargets = computed(() => [mockDropTarget])
      const isValidDrop = computed(() => true)
      const dropFeedback = ref<DropFeedback | null>(null)

      const context: SchemaDragDropContext = {
        draggedColumn,
        dragState,
        isOverDropZone,
        hoveredTarget,
        validDropTargets,
        isValidDrop,
        dropFeedback,
      }

      const feedback: DropFeedback = {
        type: 'success',
        message: 'Valid mapping for labels',
        suggestions: [],
      }

      context.dropFeedback.value = feedback

      expect(context.dropFeedback.value).toEqual(feedback)
      expect(context.validDropTargets.value).toContain(mockDropTarget)
      expect(context.isValidDrop.value).toBe(true)
    })
  })

  describe('DropValidation', () => {
    it('should create valid drop validation result', () => {
      const validation: DropValidation = {
        isValid: true,
        reason: 'Compatible data types',
        suggestions: ['Use this mapping for best results'],
      }

      expect(validation.isValid).toBe(true)
      expect(validation.reason).toBe('Compatible data types')
      expect(validation.suggestions).toEqual(['Use this mapping for best results'])
    })

    it('should create invalid drop validation result', () => {
      const validation: DropValidation = {
        isValid: false,
        reason: 'Incompatible data types',
        suggestions: ['Try using a text column instead', 'Convert data type first'],
      }

      expect(validation.isValid).toBe(false)
      expect(validation.reason).toBe('Incompatible data types')
      expect(validation.suggestions).toHaveLength(2)
    })
  })

  describe('DragEventData', () => {
    it('should create valid drag event data', () => {
      const mockElement = {} as HTMLElement // Mock element for testing
      const timestamp = Date.now()

      const dragEvent: DragEventData = {
        column: mockColumnInfo,
        sourceElement: mockElement,
        timestamp,
      }

      expect(dragEvent.column).toEqual(mockColumnInfo)
      expect(dragEvent.sourceElement).toBe(mockElement)
      expect(dragEvent.timestamp).toBe(timestamp)
    })
  })

  describe('DropEventData', () => {
    it('should create valid drop event data', () => {
      const timestamp = Date.now()
      const position = { x: 100, y: 200 }

      const dropEvent: DropEventData = {
        column: mockColumnInfo,
        target: mockDropTarget,
        position,
        timestamp,
      }

      expect(dropEvent.column).toEqual(mockColumnInfo)
      expect(dropEvent.target).toEqual(mockDropTarget)
      expect(dropEvent.position).toEqual(position)
      expect(dropEvent.timestamp).toBe(timestamp)
    })
  })

  describe('DragVisualState', () => {
    it('should create valid drag visual state', () => {
      const visualState: DragVisualState = {
        isDragging: true,
        draggedColumn: mockColumnInfo,
        validDropTargets: ['item.terms.labels.en', 'item.terms.descriptions.en'],
        invalidDropTargets: ['item.statements[0].value'],
        hoveredTarget: 'item.terms.labels.en',
      }

      expect(visualState.isDragging).toBe(true)
      expect(visualState.draggedColumn).toEqual(mockColumnInfo)
      expect(visualState.validDropTargets).toHaveLength(2)
      expect(visualState.invalidDropTargets).toHaveLength(1)
      expect(visualState.hoveredTarget).toBe('item.terms.labels.en')
    })

    it('should handle idle visual state', () => {
      const visualState: DragVisualState = {
        isDragging: false,
        draggedColumn: null,
        validDropTargets: [],
        invalidDropTargets: [],
        hoveredTarget: null,
      }

      expect(visualState.isDragging).toBe(false)
      expect(visualState.draggedColumn).toBeNull()
      expect(visualState.validDropTargets).toHaveLength(0)
      expect(visualState.invalidDropTargets).toHaveLength(0)
      expect(visualState.hoveredTarget).toBeNull()
    })
  })

  describe('DropTarget', () => {
    it('should create valid drop targets for different types', () => {
      const labelTarget: DropTarget = {
        type: 'label',
        path: 'item.terms.labels.en',
        acceptedTypes: ['string'],
        language: 'en',
        isRequired: false,
      }

      const statementTarget: DropTarget = {
        type: 'statement',
        path: 'item.statements[0].value',
        acceptedTypes: ['string', 'wikibase-item'],
        propertyId: 'P31',
        isRequired: true,
      }

      expect(labelTarget.type).toBe('label')
      expect(labelTarget.language).toBe('en')
      expect(labelTarget.acceptedTypes).toContain('string')

      expect(statementTarget.type).toBe('statement')
      expect(statementTarget.propertyId).toBe('P31')
      expect(statementTarget.isRequired).toBe(true)
    })
  })

  describe('DropFeedback', () => {
    it('should create success feedback', () => {
      const feedback: DropFeedback = {
        type: 'success',
        message: 'Column successfully mapped to label',
      }

      expect(feedback.type).toBe('success')
      expect(feedback.message).toBe('Column successfully mapped to label')
    })

    it('should create error feedback with suggestions', () => {
      const feedback: DropFeedback = {
        type: 'error',
        message: 'Invalid data type for this target',
        suggestions: ['Use a text column for labels', 'Convert the column data type first'],
      }

      expect(feedback.type).toBe('error')
      expect(feedback.suggestions).toHaveLength(2)
    })

    it('should create warning feedback', () => {
      const feedback: DropFeedback = {
        type: 'warning',
        message: 'This mapping may result in data loss',
        suggestions: ['Review the column data before proceeding'],
      }

      expect(feedback.type).toBe('warning')
      expect(feedback.suggestions).toHaveLength(1)
    })
  })
})
