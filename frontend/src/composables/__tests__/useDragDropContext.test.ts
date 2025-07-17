import { describe, it, expect, beforeEach } from 'bun:test'
import { useDragDropContext, createDropZoneConfig } from '@frontend/composables/useDragDropContext'
import type { ColumnInfo, WikibaseDataType } from '@frontend/types/wikibase-schema'
import type { DropTarget } from '@frontend/types/drag-drop'

describe('useDragDropContext', () => {
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

  describe('Context State Management', () => {
    it('should initialize with default state', () => {
      const context = useDragDropContext()

      expect(context.draggedColumn.value).toBeNull()
      expect(context.dragState.value).toBe('idle')
      expect(context.isOverDropZone.value).toBe(false)
      expect(context.hoveredTarget.value).toBeNull()
      expect(context.validDropTargets.value).toEqual([])
      expect(context.isValidDrop.value).toBe(false)
      expect(context.dropFeedback.value).toBeNull()
    })

    it('should handle drag start correctly', () => {
      const context = useDragDropContext()
      const mockElement = {} as HTMLElement

      context.startDrag(mockColumnInfo, mockElement)

      expect(context.draggedColumn.value).toEqual(mockColumnInfo)
      expect(context.dragState.value).toBe('dragging')
      expect(context.dropFeedback.value).toBeNull()
    })

    it('should handle drag end correctly', () => {
      const context = useDragDropContext()
      const mockElement = {} as HTMLElement

      // Start drag first
      context.startDrag(mockColumnInfo, mockElement)
      context.enterDropZone('item.terms.labels.en')

      // End drag
      context.endDrag()

      expect(context.draggedColumn.value).toBeNull()
      expect(context.dragState.value).toBe('idle')
      expect(context.isOverDropZone.value).toBe(false)
      expect(context.hoveredTarget.value).toBeNull()
      expect(context.dropFeedback.value).toBeNull()
    })

    it('should handle drop zone enter/leave', () => {
      const context = useDragDropContext()
      const mockElement = {} as HTMLElement

      // Set up available targets
      context.setAvailableTargets([mockDropTarget])
      context.startDrag(mockColumnInfo, mockElement)

      // Enter drop zone
      context.enterDropZone('item.terms.labels.en')

      expect(context.isOverDropZone.value).toBe(true)
      expect(context.hoveredTarget.value).toBe('item.terms.labels.en')
      expect(context.dropFeedback.value).toBeDefined()
      expect(context.dropFeedback.value?.type).toBe('success')

      // Leave drop zone
      context.leaveDropZone()

      expect(context.isOverDropZone.value).toBe(false)
      expect(context.hoveredTarget.value).toBeNull()
      expect(context.dropFeedback.value).toBeNull()
    })
  })

  describe('Drop Validation', () => {
    it('should validate compatible data types', () => {
      const context = useDragDropContext()
      const validation = context.validateDrop(mockColumnInfo, mockDropTarget)

      expect(validation).toEqual({
        isValid: true,
        reason: 'Compatible mapping',
      })
    })

    it('should reject incompatible data types', () => {
      const context = useDragDropContext()
      const numericColumn: ColumnInfo = {
        name: 'age',
        dataType: 'INTEGER',
        sampleValues: ['25', '30'],
        nullable: false,
      }

      const validation = context.validateDrop(numericColumn, mockDropTarget)

      expect(validation).toEqual({
        isValid: false,
        reason: "Column type 'INTEGER' is not compatible with target types: string",
      })
    })

    it('should reject nullable columns for required targets', () => {
      const context = useDragDropContext()
      const nullableColumn: ColumnInfo = {
        ...mockColumnInfo,
        nullable: true,
      }
      const requiredTarget: DropTarget = {
        ...mockDropTarget,
        isRequired: true,
      }

      const validation = context.validateDrop(nullableColumn, requiredTarget)

      expect(validation).toEqual({
        isValid: false,
        reason: 'Required field cannot accept nullable column',
      })
    })

    it('should validate statement targets with property IDs', () => {
      const context = useDragDropContext()
      const statementTarget: DropTarget = {
        type: 'statement',
        path: 'item.statements[0].value',
        acceptedTypes: ['string'],
        propertyId: 'P31',
      }

      const validation = context.validateDrop(mockColumnInfo, statementTarget)

      expect(validation).toEqual({
        isValid: true,
        reason: 'Compatible mapping',
      })
    })

    it('should reject statement targets without property IDs', () => {
      const context = useDragDropContext()
      const statementTarget: DropTarget = {
        type: 'statement',
        path: 'item.statements[0].value',
        acceptedTypes: ['string'],
        // Missing propertyId
      }

      const validation = context.validateDrop(mockColumnInfo, statementTarget)

      expect(validation).toEqual({
        isValid: false,
        reason: 'Statement target must have a property ID',
      })
    })

    it('should validate label length constraints', () => {
      const context = useDragDropContext()
      const longValueColumn: ColumnInfo = {
        name: 'long_text',
        dataType: 'VARCHAR',
        sampleValues: ['a'.repeat(300)], // Very long value
        nullable: false,
      }

      const validation = context.validateDrop(longValueColumn, mockDropTarget)

      expect(validation).toEqual({
        isValid: false,
        reason: 'label values should be shorter than 250 characters',
      })
    })
  })

  describe('Drop Performance', () => {
    it('should perform successful drop', async () => {
      const context = useDragDropContext()
      context.setAvailableTargets([mockDropTarget])

      const resultPromise = context.performDrop(mockColumnInfo, mockDropTarget)

      expect(resultPromise).toBeInstanceOf(Promise)
      expect(context.dragState.value).toBe('dropping')

      const result = await resultPromise

      expect(result).toBe(true)
      expect(context.draggedColumn.value).toBeNull()
      expect(context.dragState.value).toBe('idle')
      expect(context.dropFeedback.value?.type).toBe('success')
    })

    it('should handle failed drop', async () => {
      const context = useDragDropContext()
      const incompatibleTarget: DropTarget = {
        type: 'qualifier',
        path: 'item.statements[0].qualifiers[0].value',
        acceptedTypes: ['time'], // Incompatible with VARCHAR
        propertyId: 'P585',
      }

      const resultPromise = context.performDrop(mockColumnInfo, incompatibleTarget)

      expect(resultPromise).toBeInstanceOf(Promise)

      const result = await resultPromise

      expect(result).toBe(false)
      expect(context.dropFeedback.value?.type).toBe('error')
    })
  })

  describe('Valid Targets Computation', () => {
    it('should compute valid targets for column', () => {
      const context = useDragDropContext()
      const targets = [
        mockDropTarget,
        {
          type: 'description' as const,
          path: 'item.terms.descriptions.en',
          acceptedTypes: ['string'] as WikibaseDataType[],
          language: 'en',
        },
        {
          type: 'qualifier' as const,
          path: 'item.statements[0].qualifiers[0].value',
          acceptedTypes: ['time'] as WikibaseDataType[], // Incompatible
          propertyId: 'P585',
        },
      ]

      context.setAvailableTargets(targets)

      const validTargets = context.getValidTargetsForColumn(mockColumnInfo)

      expect(validTargets).toHaveLength(2) // Only label and description should be valid
      expect(validTargets.map((t) => t.type)).toEqual(['label', 'description'])
    })

    it('should update valid targets when dragged column changes', () => {
      const context = useDragDropContext()
      const mockElement = {} as HTMLElement

      context.setAvailableTargets([mockDropTarget])

      // Initially no valid targets
      expect(context.validDropTargets.value).toHaveLength(0)

      // Start dragging
      context.startDrag(mockColumnInfo, mockElement)

      // Now should have valid targets
      expect(context.validDropTargets.value).toHaveLength(1)
      expect(context.validDropTargets.value[0]).toEqual(mockDropTarget)
    })
  })

  describe('Computed Properties', () => {
    it('should compute isValidDrop correctly', () => {
      const context = useDragDropContext()
      const mockElement = {} as HTMLElement

      context.setAvailableTargets([mockDropTarget])

      // Initially not valid (no drag in progress)
      expect(context.isValidDrop.value).toBe(false)

      // Start drag
      context.startDrag(mockColumnInfo, mockElement)

      // Still not valid (no hovered target)
      expect(context.isValidDrop.value).toBe(false)

      // Enter valid drop zone
      context.enterDropZone('item.terms.labels.en')

      // Now should be valid
      expect(context.isValidDrop.value).toBe(true)
    })
  })
})

describe('createDropZoneConfig', () => {
  it('should create valid drop zone configuration', () => {
    const onDropCallback = () => {}
    const config = createDropZoneConfig('item.terms.labels.en', ['string'], onDropCallback)

    expect(config).toEqual({
      acceptedDataTypes: ['application/x-column-data'],
      onDrop: expect.any(Function),
      onDragOver: expect.any(Function),
      onDragEnter: expect.any(Function),
      onDragLeave: expect.any(Function),
      validateDrop: expect.any(Function),
    })
  })

  it('should validate drop data correctly', () => {
    const config = createDropZoneConfig('item.terms.labels.en', ['string'], () => {})

    const validData = JSON.stringify({
      name: 'test',
      dataType: 'VARCHAR',
      sampleValues: [],
      nullable: false,
    })

    const invalidData = JSON.stringify({
      name: 'test',
      dataType: 'INTEGER',
      sampleValues: [],
      nullable: false,
    })

    expect(config.validateDrop!(validData)).toBe(true)
    expect(config.validateDrop!(invalidData)).toBe(false)
  })

  it('should handle drop events correctly', () => {
    let dropCallbackCalled = false
    let droppedColumn: ColumnInfo | null = null

    const config = createDropZoneConfig('item.terms.labels.en', ['string'], (column) => {
      dropCallbackCalled = true
      droppedColumn = column
    })

    const mockColumnData = {
      name: 'test_column',
      dataType: 'VARCHAR',
      sampleValues: ['test'],
      nullable: false,
    }

    const mockEvent = {
      preventDefault: () => {},
      dataTransfer: {
        getData: (type: string) => {
          if (type === 'application/x-column-data') {
            return JSON.stringify(mockColumnData)
          }
          return ''
        },
      },
    } as DragEvent

    config.onDrop(mockEvent)

    expect(dropCallbackCalled).toBe(true)
    expect(droppedColumn).toEqual(mockColumnData)
  })

  it('should handle drag over events', () => {
    const config = createDropZoneConfig('item.terms.labels.en', ['string'], () => {})

    let preventDefaultCalled = false
    const mockEvent = {
      preventDefault: () => {
        preventDefaultCalled = true
      },
      dataTransfer: { dropEffect: '' },
    } as any

    config.onDragOver!(mockEvent)

    expect(preventDefaultCalled).toBe(true)
    expect(mockEvent.dataTransfer.dropEffect).toBe('copy')
  })
})
