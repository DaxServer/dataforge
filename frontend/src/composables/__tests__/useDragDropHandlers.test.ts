import { describe, test, expect, beforeEach } from 'bun:test'
import { createPinia, setActivePinia } from 'pinia'
import { useDragDropHandlers } from '@frontend/composables/useDragDropHandlers'
import { useDragDropStore } from '@frontend/stores/drag-drop.store'
import type { ColumnInfo } from '@frontend/types/wikibase-schema'

describe('useDragDropHandlers Composable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('createDragOverHandler', () => {
    test('should create handler that sets copy cursor for valid text column', () => {
      const dragDropStore = useDragDropStore()
      const { createDragOverHandler } = useDragDropHandlers()

      const validColumn: ColumnInfo = {
        name: 'test_column',
        dataType: 'TEXT',
        nullable: false,
        sampleValues: ['sample1', 'sample2'],
        uniqueCount: 2,
      }
      dragDropStore.startDrag(validColumn)

      const handler = createDragOverHandler(['string'])
      const mockEvent = {
        preventDefault: () => {},
        dataTransfer: { dropEffect: '' },
      } as unknown as DragEvent

      handler(mockEvent)

      expect(mockEvent.dataTransfer!.dropEffect).toBe('copy')
    })

    test('should create handler that sets none cursor for invalid column', () => {
      const dragDropStore = useDragDropStore()
      const { createDragOverHandler } = useDragDropHandlers()

      const invalidColumn: ColumnInfo = {
        name: 'test_column',
        dataType: 'INTEGER',
        nullable: false,
        sampleValues: ['1', '2'],
        uniqueCount: 2,
      }
      dragDropStore.startDrag(invalidColumn)

      const handler = createDragOverHandler(['string'])
      const mockEvent = {
        preventDefault: () => {},
        dataTransfer: { dropEffect: '' },
      } as unknown as DragEvent

      handler(mockEvent)

      expect(mockEvent.dataTransfer!.dropEffect).toBe('none')
    })

    test('should create handler that works with specific accepted types', () => {
      const dragDropStore = useDragDropStore()
      const { createDragOverHandler } = useDragDropHandlers()

      const validColumn: ColumnInfo = {
        name: 'test_column',
        dataType: 'VARCHAR',
        nullable: false,
        sampleValues: ['sample'],
        uniqueCount: 1,
      }
      dragDropStore.startDrag(validColumn)

      const handler = createDragOverHandler(['string', 'url'])
      const mockEvent = {
        preventDefault: () => {},
        dataTransfer: { dropEffect: '' },
      } as unknown as DragEvent

      handler(mockEvent)

      expect(mockEvent.dataTransfer!.dropEffect).toBe('copy')
    })

    test('should handle missing dataTransfer gracefully', () => {
      const { createDragOverHandler } = useDragDropHandlers()
      const handler = createDragOverHandler(['string'])

      const mockEvent = {
        preventDefault: () => {},
        dataTransfer: null,
      } as unknown as DragEvent

      expect(() => handler(mockEvent)).not.toThrow()
    })
  })

  describe('createDragEnterHandler', () => {
    test('should create handler that calls onEnter callback', () => {
      const { createDragEnterHandler } = useDragDropHandlers()
      let callbackCalled = false

      const handler = createDragEnterHandler(() => {
        callbackCalled = true
      })

      const mockEvent = {
        preventDefault: () => {},
      } as unknown as DragEvent

      handler(mockEvent)

      expect(callbackCalled).toBe(true)
    })

    test('should work without callback', () => {
      const { createDragEnterHandler } = useDragDropHandlers()
      const handler = createDragEnterHandler()

      const mockEvent = {
        preventDefault: () => {},
      } as DragEvent

      expect(() => handler(mockEvent)).not.toThrow()
    })

    test('should work without event parameter for backward compatibility', () => {
      const { createDragEnterHandler } = useDragDropHandlers()
      let callbackCalled = false

      const handler = createDragEnterHandler(() => {
        callbackCalled = true
      })

      expect(() => handler()).not.toThrow()
      expect(callbackCalled).toBe(true)
    })
  })

  describe('createDragLeaveHandler', () => {
    test('should create handler that calls onLeave callback', () => {
      const { createDragLeaveHandler } = useDragDropHandlers()
      let callbackCalled = false

      const handler = createDragLeaveHandler(() => {
        callbackCalled = true
      })

      const mockEvent = {
        preventDefault: () => {},
      } as DragEvent

      handler(mockEvent)

      expect(callbackCalled).toBe(true)
    })

    test('should work without event parameter for backward compatibility', () => {
      const { createDragLeaveHandler } = useDragDropHandlers()
      let callbackCalled = false

      const handler = createDragLeaveHandler(() => {
        callbackCalled = true
      })

      expect(() => handler()).not.toThrow()
      expect(callbackCalled).toBe(true)
    })
  })

  describe('createDropHandler', () => {
    test('should create handler that validates and calls onValidDrop for valid column', () => {
      const { createDropHandler } = useDragDropHandlers()
      let droppedColumn: ColumnInfo | null = null

      const handler = createDropHandler(['string'], (column) => {
        droppedColumn = column
      })

      const validColumn: ColumnInfo = {
        name: 'test_column',
        dataType: 'TEXT',
        nullable: false,
        sampleValues: ['sample'],
        uniqueCount: 1,
      }

      const mockEvent = {
        preventDefault: () => {},
        dataTransfer: {
          getData: () => JSON.stringify(validColumn),
        },
      } as unknown as DragEvent

      handler(mockEvent)

      expect(droppedColumn).not.toBeNull()
      // @ts-expect-error
      expect(droppedColumn).toEqual(validColumn)
    })

    test('should create handler that calls onInvalidDrop for invalid column', () => {
      const { createDropHandler } = useDragDropHandlers()
      let errorMessage: string | null = null

      const handler = createDropHandler(
        ['string'],
        () => {},
        (error) => {
          errorMessage = error
        },
      )

      const invalidColumn: ColumnInfo = {
        name: 'test_column',
        dataType: 'INTEGER',
        nullable: false,
        sampleValues: ['1'],
        uniqueCount: 1,
      }

      const mockEvent = {
        preventDefault: () => {},
        dataTransfer: {
          getData: () => JSON.stringify(invalidColumn),
        },
      } as unknown as DragEvent

      handler(mockEvent)

      expect(errorMessage).toContain('not compatible')
    })

    test('should handle missing column data', () => {
      const { createDropHandler } = useDragDropHandlers()
      let errorMessage: string | null = null

      const handler = createDropHandler(
        ['string'],
        () => {},
        (error) => {
          errorMessage = error
        },
      )

      const mockEvent = {
        preventDefault: () => {},
        dataTransfer: {
          getData: () => '',
        },
      } as unknown as DragEvent

      handler(mockEvent)

      expect(errorMessage).not.toBeNull()
      // @ts-expect-error
      expect(errorMessage).toBe('No column data found')
    })
  })

  describe('validateColumnCompatibility', () => {
    test('should validate text column compatibility', () => {
      const { validateColumnCompatibility } = useDragDropHandlers()

      const textColumn: ColumnInfo = {
        name: 'test_column',
        dataType: 'TEXT',
        nullable: false,
        sampleValues: ['sample'],
        uniqueCount: 1,
      }

      expect(validateColumnCompatibility(textColumn, ['string'])).toBe(true)
    })

    test('should reject non-text column for string validation', () => {
      const { validateColumnCompatibility } = useDragDropHandlers()

      const intColumn: ColumnInfo = {
        name: 'test_column',
        dataType: 'INTEGER',
        nullable: false,
        sampleValues: ['1'],
        uniqueCount: 1,
      }

      expect(validateColumnCompatibility(intColumn, ['string'])).toBe(false)
    })

    test('should validate specific accepted types', () => {
      const { validateColumnCompatibility } = useDragDropHandlers()

      const varcharColumn: ColumnInfo = {
        name: 'test_column',
        dataType: 'VARCHAR',
        nullable: false,
        sampleValues: ['sample'],
        uniqueCount: 1,
      }

      expect(validateColumnCompatibility(varcharColumn, ['string', 'url'])).toBe(true)
    })

    test('should handle null column', () => {
      const { validateColumnCompatibility } = useDragDropHandlers()

      expect(validateColumnCompatibility(null, ['string'])).toBe(false)
    })
  })
})
