import { describe, test, expect, beforeEach } from 'bun:test'
import { createPinia, setActivePinia } from 'pinia'
import { useStatementDropZone } from '@frontend/composables/useStatementDropZone'
import { useDragDropStore } from '@frontend/stores/drag-drop.store'
import type { ColumnInfo } from '@frontend/types/wikibase-schema'

describe('useStatementDropZone', () => {
  let testColumn: ColumnInfo
  let droppedColumn: ColumnInfo | null

  beforeEach(() => {
    setActivePinia(createPinia())

    testColumn = {
      name: 'test_column',
      dataType: 'VARCHAR',
      sampleValues: ['value1', 'value2', 'value3'],
      nullable: false,
      uniqueCount: 100,
    }

    droppedColumn = null
  })

  describe('Initial State', () => {
    test('should initialize with isOverDropZone as false', () => {
      const { isOverDropZone } = useStatementDropZone()

      expect(isOverDropZone.value).toBe(false)
    })

    test('should initialize with default drop zone classes', () => {
      const { dropZoneClasses } = useStatementDropZone()

      expect(dropZoneClasses.value['border-primary-400 bg-primary-50']).toBe(false)
      expect(dropZoneClasses.value['border-green-400 bg-green-50']).toBe(false)
      expect(dropZoneClasses.value['border-red-400 bg-red-50']).toBe(false)
    })
  })

  describe('Drag Over Handler', () => {
    test('should prevent default and set copy effect when column is being dragged', () => {
      const dragDropStore = useDragDropStore()
      const { handleDragOver } = useStatementDropZone()

      dragDropStore.startDrag(testColumn)

      let preventDefaultCalled = false
      const mockEvent = {
        preventDefault: () => {
          preventDefaultCalled = true
        },
        dataTransfer: { dropEffect: '' },
      } as unknown as DragEvent

      handleDragOver(mockEvent)

      expect(preventDefaultCalled).toBe(true)
      expect(mockEvent.dataTransfer!.dropEffect).toBe('copy')
    })

    test('should prevent default and set none effect when no column is being dragged', () => {
      const { handleDragOver } = useStatementDropZone()

      let preventDefaultCalled = false
      const mockEvent = {
        preventDefault: () => {
          preventDefaultCalled = true
        },
        dataTransfer: { dropEffect: '' },
      } as unknown as DragEvent

      handleDragOver(mockEvent)

      expect(preventDefaultCalled).toBe(true)
      expect(mockEvent.dataTransfer!.dropEffect).toBe('none')
    })
  })

  describe('Drag Enter Handler', () => {
    test('should set isOverDropZone to true when drag enters', () => {
      const { isOverDropZone, handleDragEnter } = useStatementDropZone()

      const mockEvent = {
        preventDefault: () => {},
      } as unknown as DragEvent

      handleDragEnter(mockEvent)

      expect(isOverDropZone.value).toBe(true)
    })
  })

  describe('Drag Leave Handler', () => {
    test('should set isOverDropZone to false when drag leaves', () => {
      const { isOverDropZone, handleDragEnter, handleDragLeave } = useStatementDropZone()

      // First enter
      const enterEvent = {
        preventDefault: () => {},
      } as DragEvent

      handleDragEnter(enterEvent)
      expect(isOverDropZone.value).toBe(true)

      // Then leave
      const leaveEvent = {
        preventDefault: () => {},
      } as unknown as DragEvent

      handleDragLeave(leaveEvent)
      expect(isOverDropZone.value).toBe(false)
    })
  })

  describe('Drop Handler', () => {
    test('should call column drop callback with valid column data', () => {
      const { handleDrop, setOnColumnDrop } = useStatementDropZone()

      setOnColumnDrop((columnInfo) => {
        droppedColumn = columnInfo
      })

      const mockEvent = {
        preventDefault: () => {},
        dataTransfer: {
          getData: (type: string) => {
            if (type === 'application/x-column-data') {
              return JSON.stringify(testColumn)
            }
            return ''
          },
        },
      } as unknown as DragEvent

      handleDrop(mockEvent)

      expect(droppedColumn).toEqual(testColumn)
    })

    test('should not call callback when no column data is provided', () => {
      const { handleDrop, setOnColumnDrop } = useStatementDropZone()

      setOnColumnDrop((columnInfo) => {
        droppedColumn = columnInfo
      })

      const mockEvent = {
        preventDefault: () => {},
        dataTransfer: {
          getData: () => 'invalid json',
        },
      } as unknown as DragEvent

      handleDrop(mockEvent)

      expect(droppedColumn).toBeNull()
    })

    test('should reset isOverDropZone to false after drop', () => {
      const { isOverDropZone, handleDragEnter, handleDrop, setOnColumnDrop } =
        useStatementDropZone()

      setOnColumnDrop(() => {})

      // First enter to set hover state
      const enterEvent = {
        preventDefault: () => {},
      } as DragEvent

      handleDragEnter(enterEvent)
      expect(isOverDropZone.value).toBe(true)

      // Then drop
      const dropEvent = {
        preventDefault: () => {},
        dataTransfer: {
          getData: () => JSON.stringify(testColumn),
        },
      } as unknown as DragEvent

      handleDrop(dropEvent)

      expect(isOverDropZone.value).toBe(false)
    })
  })

  describe('Drop Zone Classes Reactivity', () => {
    test('should update classes when isOverDropZone changes', () => {
      const { isOverDropZone, dropZoneClasses, handleDragEnter, handleDragLeave } =
        useStatementDropZone()

      // Initially not over drop zone
      expect(dropZoneClasses.value['border-primary-400 bg-primary-50']).toBe(false)

      // Enter drop zone
      const enterEvent = {
        preventDefault: () => {},
      } as DragEvent

      handleDragEnter(enterEvent)
      expect(isOverDropZone.value).toBe(true)
      expect(dropZoneClasses.value['border-primary-400 bg-primary-50']).toBe(true)

      // Leave drop zone
      const leaveEvent = {
        preventDefault: () => {},
      } as DragEvent

      handleDragLeave(leaveEvent)
      expect(isOverDropZone.value).toBe(false)
      expect(dropZoneClasses.value['border-primary-400 bg-primary-50']).toBe(false)
    })

    test('should show green border when column is being dragged', () => {
      const dragDropStore = useDragDropStore()
      const { dropZoneClasses } = useStatementDropZone()

      dragDropStore.startDrag(testColumn)

      expect(dropZoneClasses.value['border-green-400 bg-green-50']).toBeTruthy()
    })

    test('should not show green border when no column is being dragged', () => {
      const { dropZoneClasses } = useStatementDropZone()

      expect(dropZoneClasses.value['border-green-400 bg-green-50']).toBeFalsy()
    })
  })

  describe('Column Drop Callback Management', () => {
    test('should allow setting and updating column drop callback', () => {
      const { setOnColumnDrop, handleDrop } = useStatementDropZone()

      let firstCallbackCalled = false
      let secondCallbackCalled = false

      // Set first callback
      setOnColumnDrop(() => {
        firstCallbackCalled = true
      })

      // Set second callback (should replace first)
      setOnColumnDrop(() => {
        secondCallbackCalled = true
      })

      const mockEvent = {
        preventDefault: () => {},
        dataTransfer: {
          getData: () => JSON.stringify(testColumn),
        },
      } as unknown as DragEvent

      handleDrop(mockEvent)

      expect(firstCallbackCalled).toBe(false)
      expect(secondCallbackCalled).toBe(true)
    })
  })

  describe('Integration with Drag Drop Store', () => {
    test('should react to drag drop store state changes', () => {
      const dragDropStore = useDragDropStore()
      const { dropZoneClasses } = useStatementDropZone()

      // Initially no drag
      expect(dropZoneClasses.value['border-green-400 bg-green-50']).toBe(false)

      // Start drag
      dragDropStore.startDrag(testColumn)
      expect(dropZoneClasses.value['border-green-400 bg-green-50']).toBeTruthy()

      // End drag
      dragDropStore.endDrag()
      expect(dropZoneClasses.value['border-green-400 bg-green-50']).toBeFalsy()
    })
  })
})
