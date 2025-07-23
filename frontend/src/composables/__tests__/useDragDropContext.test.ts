import { describe, it, expect, beforeEach } from 'bun:test'
import { createPinia, setActivePinia } from 'pinia'
import { useDragDropContext } from '@frontend/composables/useDragDropContext'
import { useDragDropStore } from '@frontend/stores/drag-drop.store'
import type { ColumnInfo, WikibaseDataType } from '@frontend/types/wikibase-schema'
import type { DropTarget } from '@frontend/types/drag-drop'

describe('useDragDropContext', () => {
  let mockColumnInfo: ColumnInfo
  let mockDropTarget: DropTarget

  beforeEach(() => {
    setActivePinia(createPinia())

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
    it('should initialize with default local state', () => {
      const context = useDragDropContext()

      // Only test what the composable owns
      expect(context.isOverDropZone.value).toBe(false)
      expect(context.dropFeedback.value).toBeNull()
    })

    it('should handle drag start correctly', () => {
      const context = useDragDropContext()
      const mockElement = {} as HTMLElement

      context.startDrag(mockColumnInfo, mockElement)

      // The composable should clear its local feedback
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

      // Check local state managed by composable
      expect(context.isOverDropZone.value).toBe(false)
      expect(context.dropFeedback.value).toBeNull()
    })

    it('should handle drop zone enter/leave', () => {
      const context = useDragDropContext()
      const mockElement = {} as HTMLElement

      // Set up available targets
      const store = useDragDropStore()
      store.setAvailableTargets([mockDropTarget])
      context.startDrag(mockColumnInfo, mockElement)

      // Enter drop zone
      context.enterDropZone('item.terms.labels.en')

      expect(context.isOverDropZone.value).toBe(true)
      expect(context.dropFeedback.value).toBeDefined()
      expect(context.dropFeedback.value?.type).toBe('success')

      // Leave drop zone
      context.leaveDropZone()

      expect(context.isOverDropZone.value).toBe(false)
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
      const store = useDragDropStore()
      store.setAvailableTargets([mockDropTarget])

      const resultPromise = context.performDrop(mockColumnInfo, mockDropTarget)

      expect(resultPromise).toBeInstanceOf(Promise)

      const result = await resultPromise

      expect(result).toBe(true)
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
      const store = useDragDropStore()
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

      store.setAvailableTargets(targets)

      const validTargets = store.getValidTargetsForColumn(mockColumnInfo)

      expect(validTargets).toHaveLength(2) // Only label and description should be valid
      expect(validTargets.map((t) => t.type)).toEqual(['label', 'description'])
    })

    it('should delegate to store for valid targets computation', () => {
      const store = useDragDropStore()

      store.setAvailableTargets([mockDropTarget])

      // Test that the method exists and can be called
      const validTargets = store.getValidTargetsForColumn(mockColumnInfo)
      expect(Array.isArray(validTargets)).toBe(true)
    })
  })

  describe('Composable Methods', () => {
    it('should provide all required utility methods', () => {
      const context = useDragDropContext()

      // Test that all expected methods exist
      expect(typeof context.startDrag).toBe('function')
      expect(typeof context.endDrag).toBe('function')
      expect(typeof context.enterDropZone).toBe('function')
      expect(typeof context.leaveDropZone).toBe('function')
      expect(typeof context.validateDrop).toBe('function')
      expect(typeof context.performDrop).toBe('function')
      expect(typeof context.createDropZoneConfig).toBe('function')
    })

    it('should work with store setAvailableTargets method', () => {
      const store = useDragDropStore()
      expect(typeof store.setAvailableTargets).toBe('function')

      const targets = [mockDropTarget]
      store.setAvailableTargets(targets)

      // Verify targets were set (this would require accessing store state)
      // For now, just verify the method exists and can be called
    })

    it('should work with store getValidTargetsForColumn method', () => {
      const store = useDragDropStore()
      expect(typeof store.getValidTargetsForColumn).toBe('function')

      store.setAvailableTargets([mockDropTarget])
      const validTargets = store.getValidTargetsForColumn(mockColumnInfo)

      expect(Array.isArray(validTargets)).toBe(true)
    })
  })
})

describe('createDropZoneConfig', () => {
  it('should create valid drop zone configuration', () => {
    const context = useDragDropContext()
    const onDropCallback = () => {}
    const config = context.createDropZoneConfig('item.terms.labels.en', ['string'], onDropCallback)

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
    const context = useDragDropContext()
    const config = context.createDropZoneConfig('item.terms.labels.en', ['string'], () => {})

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
    const context = useDragDropContext()
    let dropCallbackCalled = false
    let droppedColumn: ColumnInfo | null = null

    const config = context.createDropZoneConfig('item.terms.labels.en', ['string'], (column) => {
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

  it('should handle drag over events with valid column', () => {
    const context = useDragDropContext()
    const config = context.createDropZoneConfig('item.terms.labels.en', ['string'], () => {})

    // Set up a valid column in the drag store
    const dragDropStore = useDragDropStore()
    const validColumn: ColumnInfo = {
      name: 'test_column',
      dataType: 'TEXT',
      nullable: false,
      sampleValues: ['sample1', 'sample2'],
      uniqueCount: 2,
    }
    dragDropStore.startDrag(validColumn)

    let preventDefaultCalled = false
    const mockEvent = {
      preventDefault: () => {
        preventDefaultCalled = true
      },
      dataTransfer: { dropEffect: '' },
    } as DragEvent

    config.onDragOver!(mockEvent)

    expect(preventDefaultCalled).toBe(true)
    expect(mockEvent.dataTransfer.dropEffect).toBe('copy')
  })

  it('should handle drag over events with invalid column', () => {
    const context = useDragDropContext()
    const config = context.createDropZoneConfig('item.terms.labels.en', ['string'], () => {})

    // Set up an invalid column in the drag store
    const dragDropStore = useDragDropStore()
    const invalidColumn: ColumnInfo = {
      name: 'test_column',
      dataType: 'INTEGER',
      nullable: false,
      sampleValues: ['1', '2'],
      uniqueCount: 2,
    }
    dragDropStore.startDrag(invalidColumn)

    let preventDefaultCalled = false
    const mockEvent = {
      preventDefault: () => {
        preventDefaultCalled = true
      },
      dataTransfer: { dropEffect: '' },
    } as DragEvent

    config.onDragOver!(mockEvent)

    expect(preventDefaultCalled).toBe(true)
    expect(mockEvent.dataTransfer.dropEffect).toBe('none')
  })

  it('should handle drag over events with no dragged column', () => {
    const context = useDragDropContext()
    const config = context.createDropZoneConfig('item.terms.labels.en', ['string'], () => {})

    let preventDefaultCalled = false
    const mockEvent = {
      preventDefault: () => {
        preventDefaultCalled = true
      },
      dataTransfer: { dropEffect: '' },
    } as DragEvent

    config.onDragOver!(mockEvent)

    expect(preventDefaultCalled).toBe(true)
    expect(mockEvent.dataTransfer.dropEffect).toBe('none')
  })
})
