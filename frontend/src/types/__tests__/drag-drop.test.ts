import { describe, it, expect } from 'bun:test'
import type {
  SchemaDragDropContext,
  DropZoneConfig,
  DropFeedback,
  DragDropContext,
  DropTarget,
  DropTargetType,
  DragState,
  DropValidation,
  DragEventData,
  DropEventData,
  DragVisualState,
  DragDropConfig,
} from '@frontend/types/drag-drop'
import type { ColumnInfo, WikibaseDataType } from '@frontend/types/wikibase-schema'

describe('Drag Drop Types', () => {
  describe('SchemaDragDropContext', () => {
    it('should handle null/idle state', () => {
      const mockRef = <T>(value: T) => ({ value }) as Ref<T>

      const context: SchemaDragDropContext = {
        isOverDropZone: mockRef(false),
        dropFeedback: mockRef(null),
      }

      expect(context.isOverDropZone.value).toBe(false)
      expect(context.dropFeedback.value).toBeNull()
    })
  })

  describe('DropZoneConfig', () => {
    it('should create complete drop zone configuration', () => {
      const mockDragEvent = {} as DragEvent
      let dropCalled = false
      let dragEnterCalled = false
      let dragLeaveCalled = false
      let dragOverCalled = false

      const config: DropZoneConfig = {
        onDrop: (event: DragEvent) => {
          dropCalled = true
          expect(event).toBe(mockDragEvent)
        },
        onDragEnter: (event: DragEvent) => {
          dragEnterCalled = true
          expect(event).toBe(mockDragEvent)
        },
        onDragLeave: (event: DragEvent) => {
          dragLeaveCalled = true
          expect(event).toBe(mockDragEvent)
        },
        onDragOver: (event: DragEvent) => {
          dragOverCalled = true
          expect(event).toBe(mockDragEvent)
        },
        acceptedDataTypes: ['application/x-column-data', 'text/plain'],
        validateDrop: (data: string) => {
          return data.includes('test_column')
        },
      }

      // Test event handlers
      config.onDrop(mockDragEvent)
      config.onDragEnter?.(mockDragEvent)
      config.onDragLeave?.(mockDragEvent)
      config.onDragOver?.(mockDragEvent)

      expect(dropCalled).toBe(true)
      expect(dragEnterCalled).toBe(true)
      expect(dragLeaveCalled).toBe(true)
      expect(dragOverCalled).toBe(true)
      expect(config.acceptedDataTypes).toContain('application/x-column-data')
      expect(config.validateDrop?.('test_column_data')).toBe(true)
      expect(config.validateDrop?.('invalid_data')).toBe(false)
    })

    it('should create minimal drop zone configuration', () => {
      let dropCalled = false

      const config: DropZoneConfig = {
        onDrop: () => {
          dropCalled = true
        },
        acceptedDataTypes: ['text/plain'],
      }

      config.onDrop({} as DragEvent)

      expect(dropCalled).toBe(true)
      expect(config.acceptedDataTypes).toHaveLength(1)
      expect(config.onDragEnter).toBeUndefined()
      expect(config.onDragLeave).toBeUndefined()
      expect(config.onDragOver).toBeUndefined()
      expect(config.validateDrop).toBeUndefined()
    })
  })

  describe('DropFeedback', () => {
    it('should create success feedback', () => {
      const feedback: DropFeedback = {
        type: 'success',
        message: 'Column successfully mapped to label',
      }

      expect(feedback).toEqual({
        type: 'success',
        message: 'Column successfully mapped to label',
      })
    })

    it('should create error feedback', () => {
      const feedback: DropFeedback = {
        type: 'error',
        message: 'Invalid data type for this target',
      }

      expect(feedback).toEqual({
        type: 'error',
        message: 'Invalid data type for this target',
      })
    })

    it('should create warning feedback', () => {
      const feedback: DropFeedback = {
        type: 'warning',
        message: 'This mapping may cause data loss',
      }

      expect(feedback).toEqual({
        type: 'warning',
        message: 'This mapping may cause data loss',
      })
    })
  })

  describe('DragDropContext', () => {
    it('should create basic drag drop context', () => {
      const columnInfo: ColumnInfo = {
        name: 'test_column',
        dataType: 'VARCHAR',
        sampleValues: ['sample1', 'sample2'],
        nullable: true,
      }

      const dropTarget: DropTarget = {
        type: 'label',
        path: 'item.terms.labels.en',
        acceptedTypes: ['string'],
        language: 'en',
      }

      const context: DragDropContext = {
        draggedColumn: columnInfo,
        dropTarget: dropTarget,
        isValidDrop: true,
        dragStartPosition: { x: 100, y: 200 },
      }

      expect(context).toEqual({
        draggedColumn: columnInfo,
        dropTarget: dropTarget,
        isValidDrop: true,
        dragStartPosition: { x: 100, y: 200 },
      })
    })

    it('should handle null values', () => {
      const context: DragDropContext = {
        draggedColumn: null,
        dropTarget: null,
        isValidDrop: false,
      }

      expect(context).toEqual({
        draggedColumn: null,
        dropTarget: null,
        isValidDrop: false,
      })
      expect(context.dragStartPosition).toBeUndefined()
    })
  })

  describe('DropTarget', () => {
    it('should create label drop target', () => {
      const target: DropTarget = {
        type: 'label',
        path: 'item.terms.labels.en',
        acceptedTypes: ['string', 'monolingualtext'],
        language: 'en',
        isRequired: true,
      }

      expect(target).toEqual({
        type: 'label',
        path: 'item.terms.labels.en',
        acceptedTypes: ['string', 'monolingualtext'],
        language: 'en',
        isRequired: true,
      })
    })

    it('should create statement drop target', () => {
      const target: DropTarget = {
        type: 'statement',
        path: 'item.statements[0].value',
        acceptedTypes: ['wikibase-item', 'string'],
        propertyId: 'P123',
      }

      expect(target).toEqual({
        type: 'statement',
        path: 'item.statements[0].value',
        acceptedTypes: ['wikibase-item', 'string'],
        propertyId: 'P123',
      })
      expect(target.language).toBeUndefined()
    })

    it('should create qualifier drop target', () => {
      const target: DropTarget = {
        type: 'qualifier',
        path: 'item.statements[0].qualifiers[0].value',
        acceptedTypes: ['time', 'quantity'],
        propertyId: 'P585',
      }

      expect(target).toEqual({
        type: 'qualifier',
        path: 'item.statements[0].qualifiers[0].value',
        acceptedTypes: ['time', 'quantity'],
        propertyId: 'P585',
      })
    })

    it('should create reference drop target', () => {
      const target: DropTarget = {
        type: 'reference',
        path: 'item.statements[0].references[0].value',
        acceptedTypes: ['url', 'external-id'],
        propertyId: 'P854',
      }

      expect(target).toEqual({
        type: 'reference',
        path: 'item.statements[0].references[0].value',
        acceptedTypes: ['url', 'external-id'],
        propertyId: 'P854',
      })
    })
  })

  describe('DropTargetType', () => {
    it('should accept all valid drop target types', () => {
      const validTypes: DropTargetType[] = [
        'label',
        'description',
        'alias',
        'statement',
        'qualifier',
        'reference',
      ]

      validTypes.forEach((type) => {
        const target: DropTarget = {
          type,
          path: `test.path.${type}`,
          acceptedTypes: ['string'],
        }

        expect(target.type).toBe(type)
      })
    })
  })

  describe('DragState', () => {
    it('should handle all drag states', () => {
      const states: DragState[] = ['idle', 'dragging', 'dropping', 'invalid']

      states.forEach((state) => {
        // Just verify the type can be assigned
        const currentState: DragState = state
        expect(currentState).toBe(state)
      })
    })
  })

  describe('DropValidation', () => {
    it('should create valid drop validation', () => {
      const validation: DropValidation = {
        isValid: true,
      }

      expect(validation).toEqual({
        isValid: true,
      })
      expect(validation.reason).toBeUndefined()
    })

    it('should create invalid drop validation with reason', () => {
      const validation: DropValidation = {
        isValid: false,
        reason: 'Data type mismatch: VARCHAR cannot be mapped to wikibase-item',
      }

      expect(validation).toEqual({
        isValid: false,
        reason: 'Data type mismatch: VARCHAR cannot be mapped to wikibase-item',
      })
    })
  })

  describe('DragEventData', () => {
    it('should create drag event data', () => {
      const mockElement = {} as HTMLElement
      const columnInfo: ColumnInfo = {
        name: 'drag_column',
        dataType: 'INTEGER',
        sampleValues: ['1', '2', '3'],
        nullable: false,
      }

      const eventData: DragEventData = {
        column: columnInfo,
        sourceElement: mockElement,
        timestamp: Date.now(),
      }

      expect(eventData).toEqual({
        column: columnInfo,
        sourceElement: mockElement,
        timestamp: eventData.timestamp,
      })
      expect(typeof eventData.timestamp).toBe('number')
      expect(eventData.timestamp).toBeGreaterThan(0)
    })
  })

  describe('DropEventData', () => {
    it('should create drop event data', () => {
      const columnInfo: ColumnInfo = {
        name: 'drop_column',
        dataType: 'VARCHAR',
        sampleValues: ['a', 'b', 'c'],
        nullable: true,
      }

      const dropTarget: DropTarget = {
        type: 'description',
        path: 'item.terms.descriptions.fr',
        acceptedTypes: ['string'],
        language: 'fr',
      }

      const eventData: DropEventData = {
        column: columnInfo,
        target: dropTarget,
        position: { x: 250, y: 300 },
        timestamp: Date.now(),
      }

      expect(eventData).toEqual({
        column: columnInfo,
        target: dropTarget,
        position: { x: 250, y: 300 },
        timestamp: eventData.timestamp,
      })
      expect(typeof eventData.timestamp).toBe('number')
    })
  })

  describe('DragVisualState', () => {
    it('should create complete visual state', () => {
      const columnInfo: ColumnInfo = {
        name: 'visual_column',
        dataType: 'TEXT',
        sampleValues: ['text1', 'text2'],
        nullable: false,
      }

      const visualState: DragVisualState = {
        isDragging: true,
        draggedColumn: columnInfo,
        validDropTargets: ['item.terms.labels.en', 'item.terms.descriptions.en'],
        invalidDropTargets: ['item.statements[0].value'],
        hoveredTarget: 'item.terms.labels.en',
      }

      expect(visualState).toEqual({
        isDragging: true,
        draggedColumn: columnInfo,
        validDropTargets: ['item.terms.labels.en', 'item.terms.descriptions.en'],
        invalidDropTargets: ['item.statements[0].value'],
        hoveredTarget: 'item.terms.labels.en',
      })
    })

    it('should handle idle visual state', () => {
      const visualState: DragVisualState = {
        isDragging: false,
        draggedColumn: null,
        validDropTargets: [],
        invalidDropTargets: [],
        hoveredTarget: null,
      }

      expect(visualState).toEqual({
        isDragging: false,
        draggedColumn: null,
        validDropTargets: [],
        invalidDropTargets: [],
        hoveredTarget: null,
      })
    })
  })

  describe('DragDropConfig', () => {
    it('should create complete configuration', () => {
      const config: DragDropConfig = {
        enableVisualFeedback: true,
        highlightValidTargets: true,
        showInvalidTargetWarnings: false,
        animationDuration: 300,
        snapToTarget: true,
      }

      expect(config).toEqual({
        enableVisualFeedback: true,
        highlightValidTargets: true,
        showInvalidTargetWarnings: false,
        animationDuration: 300,
        snapToTarget: true,
      })
    })

    it('should create minimal configuration', () => {
      const config: DragDropConfig = {
        enableVisualFeedback: false,
        highlightValidTargets: false,
        showInvalidTargetWarnings: false,
        animationDuration: 0,
        snapToTarget: false,
      }

      expect(config).toEqual({
        enableVisualFeedback: false,
        highlightValidTargets: false,
        showInvalidTargetWarnings: false,
        animationDuration: 0,
        snapToTarget: false,
      })
    })
  })

  describe('Type Integration', () => {
    it('should work with WikibaseDataType from schema-mapping', () => {
      const wikibaseTypes: WikibaseDataType[] = [
        'string',
        'wikibase-item',
        'quantity',
        'time',
        'url',
      ]

      const target: DropTarget = {
        type: 'statement',
        path: 'item.statements[0].value',
        acceptedTypes: wikibaseTypes,
      }

      expect(target.acceptedTypes).toHaveLength(5)
      expect(target.acceptedTypes).toContain('string')
      expect(target.acceptedTypes).toContain('wikibase-item')
      expect(target.acceptedTypes).toContain('quantity')
    })

    it('should integrate ColumnInfo with drag events', () => {
      const columnInfo: ColumnInfo = {
        name: 'integration_test',
        dataType: 'DECIMAL',
        sampleValues: ['1.5', '2.7', '3.14'],
        nullable: true,
        uniqueCount: 42,
      }

      const dragEvent: DragEventData = {
        column: columnInfo,
        sourceElement: {} as HTMLElement,
        timestamp: Date.now(),
      }

      const dropTarget: DropTarget = {
        type: 'statement',
        path: 'item.statements[0].value',
        acceptedTypes: ['quantity'],
        propertyId: 'P2067',
      }

      const dropEvent: DropEventData = {
        column: columnInfo,
        target: dropTarget,
        position: { x: 0, y: 0 },
        timestamp: Date.now(),
      }

      expect(dragEvent.column.uniqueCount).toBe(42)
      expect(dropEvent.target.acceptedTypes).toContain('quantity')
    })
  })
})
