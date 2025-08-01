import { describe, it, expect, beforeEach } from 'bun:test'
import { ref } from 'vue'
import type {
  SchemaDragDropContext,
  DropTarget,
  DropFeedback,
  DropValidation,
  DragEventData,
  DropEventData,
  DragVisualState,
} from '@frontend/types/drag-drop'
import type { ColumnInfo } from '@frontend/types/wikibase-schema'

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

  describe('Core Drag Drop Context', () => {
    it('should create and manage SchemaDragDropContext state', () => {
      const isOverDropZone = ref(false)
      const dropFeedback = ref<DropFeedback | null>(null)

      const context: SchemaDragDropContext = {
        isOverDropZone,
        dropFeedback,
      }

      // Test initial state
      expect(context.isOverDropZone.value).toBe(false)
      expect(context.dropFeedback.value).toBeNull()

      // Test drop zone hover states
      context.isOverDropZone.value = true
      expect(context.isOverDropZone.value).toBe(true)

      // Test validation feedback
      const feedback: DropFeedback = {
        type: 'success',
        message: 'Valid mapping for labels',
      }
      context.dropFeedback.value = feedback
      expect(context.dropFeedback.value).toEqual(feedback)

      // Test cleanup
      context.isOverDropZone.value = false
      context.dropFeedback.value = null
      expect(context.isOverDropZone.value).toBe(false)
      expect(context.dropFeedback.value).toBeNull()
    })
  })

  describe('Event and Validation Types', () => {
    it('should create DropValidation results and event data', () => {
      // Valid drop validation
      const validValidation: DropValidation = {
        isValid: true,
        reason: 'Compatible data types',
      }

      // Invalid drop validation
      const invalidValidation: DropValidation = {
        isValid: false,
        reason: 'Incompatible data types',
      }

      // Drag event data
      const mockElement = {} as HTMLElement
      const timestamp = Date.now()
      const dragEvent: DragEventData = {
        column: mockColumnInfo,
        sourceElement: mockElement,
        timestamp,
      }

      // Drop event data
      const position = { x: 100, y: 200 }
      const dropEvent: DropEventData = {
        column: mockColumnInfo,
        target: mockDropTarget,
        position,
        timestamp,
      }

      expect(validValidation.isValid).toBe(true)
      expect(invalidValidation.isValid).toBe(false)
      expect(dragEvent.column).toEqual(mockColumnInfo)
      expect(dragEvent.sourceElement).toBe(mockElement)
      expect(dropEvent.target).toEqual(mockDropTarget)
      expect(dropEvent.position).toEqual(position)
    })
  })

  describe('Visual State and Feedback Types', () => {
    it('should create DragVisualState for active and idle states', () => {
      // Active drag visual state
      const activeDragState: DragVisualState = {
        isDragging: true,
        draggedColumn: mockColumnInfo,
        validDropTargets: ['item.terms.labels.en', 'item.terms.descriptions.en'],
        invalidDropTargets: ['item.statements[0].value'],
        hoveredTarget: 'item.terms.labels.en',
      }

      // Idle visual state
      const idleDragState: DragVisualState = {
        isDragging: false,
        draggedColumn: null,
        validDropTargets: [],
        invalidDropTargets: [],
        hoveredTarget: null,
      }

      expect(activeDragState.isDragging).toBe(true)
      expect(activeDragState.draggedColumn).toEqual(mockColumnInfo)
      expect(activeDragState.validDropTargets).toHaveLength(2)
      expect(idleDragState.isDragging).toBe(false)
      expect(idleDragState.draggedColumn).toBeNull()
      expect(idleDragState.validDropTargets).toHaveLength(0)
    })

    it('should create DropTarget types and DropFeedback messages', () => {
      // Different drop target types
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

      // Different feedback types
      const successFeedback: DropFeedback = {
        type: 'success',
        message: 'Column successfully mapped to label',
      }

      const errorFeedback: DropFeedback = {
        type: 'error',
        message: 'Invalid data type for this target',
      }

      const warningFeedback: DropFeedback = {
        type: 'warning',
        message: 'This mapping may result in data loss',
      }

      expect(labelTarget.type).toBe('label')
      expect(labelTarget.language).toBe('en')
      expect(statementTarget.type).toBe('statement')
      expect(statementTarget.propertyId).toBe('P31')
      expect(successFeedback.type).toBe('success')
      expect(errorFeedback.type).toBe('error')
      expect(warningFeedback.type).toBe('warning')
    })
  })
})
