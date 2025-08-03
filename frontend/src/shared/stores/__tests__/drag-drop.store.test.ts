import { describe, it, expect, beforeEach } from 'bun:test'
import { createPinia, setActivePinia } from 'pinia'
import { useDragDropStore } from '@frontend/features/data-processing/stores/drag-drop.store'
import type { ColumnInfo, WikibaseDataType } from '@frontend/shared/types/wikibase-schema'
import type { DropTarget } from '@frontend/shared/types/drag-drop'

describe('useDragDropStore', () => {
  let mockColumnInfo: ColumnInfo
  let mockDropTargets: DropTarget[]
  let store: ReturnType<typeof useDragDropStore>

  beforeEach(() => {
    // Create a fresh Pinia instance for each test
    setActivePinia(createPinia())

    // Reset store state
    store = useDragDropStore()
    store.$reset()

    mockColumnInfo = {
      name: 'test_column',
      dataType: 'VARCHAR',
      sampleValues: ['value1', 'value2'],
      nullable: false,
      uniqueCount: 100,
    }

    mockDropTargets = [
      {
        type: 'label',
        path: 'item.terms.labels.en',
        acceptedTypes: ['string'],
        language: 'en',
        isRequired: false,
      },
      {
        type: 'description',
        path: 'item.terms.descriptions.en',
        acceptedTypes: ['string'],
        language: 'en',
        isRequired: false,
      },
      {
        type: 'statement',
        path: 'item.statements[0].value',
        acceptedTypes: ['string'],
        propertyId: 'P31',
        isRequired: true,
      },
      {
        type: 'qualifier',
        path: 'item.statements[0].qualifiers[0].value',
        acceptedTypes: ['time'],
        propertyId: 'P585',
        isRequired: false,
      },
    ]
  })

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      expect(store.draggedColumn).toBeNull()
      expect(store.dragState).toBe('idle')
      expect(store.validDropTargets).toEqual([])
      expect(store.hoveredTarget).toBeNull()
      expect(store.availableTargets).toEqual([])
      expect(store.isDragging).toBeFalse()
      expect(store.isDropping).toBeFalse()
      expect(store.hasValidTargets).toBeFalse()
    })
  })

  describe('Drag State Management', () => {
    it('should handle drag start correctly', () => {
      store.setAvailableTargets(mockDropTargets)
      store.startDrag(mockColumnInfo)

      expect(store.draggedColumn).toEqual(mockColumnInfo)
      expect(store.dragState).toBe('dragging')
      expect(store.isDragging).toBeTrue()
      expect(store.validDropTargets.length).toBeGreaterThan(0)
      expect(store.hasValidTargets).toBeTrue()
    })

    it('should handle drag end correctly', () => {
      store.setAvailableTargets(mockDropTargets)

      // Start drag first
      store.startDrag(mockColumnInfo)
      store.setHoveredTarget('item.terms.labels.en')

      // End drag
      store.endDrag()

      expect(store.draggedColumn).toBeNull()
      expect(store.dragState).toBe('idle')
      expect(store.validDropTargets).toEqual([])
      expect(store.hoveredTarget).toBeNull()
      expect(store.isDragging).toBeFalse()
      expect(store.hasValidTargets).toBeFalse()
    })

    it('should handle hovered target changes', () => {
      store.setHoveredTarget('item.terms.labels.en')
      expect(store.hoveredTarget).toBe('item.terms.labels.en')

      store.setHoveredTarget(null)
      expect(store.hoveredTarget).toBeNull()
    })

    it('should handle drag state changes', () => {
      store.setDragState('dragging')
      expect(store.dragState).toBe('dragging')
      expect(store.isDragging).toBeTrue()

      store.setDragState('dropping')
      expect(store.dragState).toBe('dropping')
      expect(store.isDropping).toBeTrue()

      store.setDragState('idle')
      expect(store.dragState).toBe('idle')
      expect(store.isDragging).toBeFalse()
      expect(store.isDropping).toBeFalse()
    })
  })

  describe('Available Targets Management', () => {
    it('should set available targets', () => {
      store.setAvailableTargets(mockDropTargets)

      expect(store.availableTargets).toEqual(mockDropTargets)
      expect(store.availableTargets.length).toBe(4)
    })

    it('should update available targets', () => {
      store.setAvailableTargets(mockDropTargets)
      expect(store.availableTargets.length).toBe(4)

      const newTargets = mockDropTargets.slice(0, 2)
      store.setAvailableTargets(newTargets)
      expect(store.availableTargets.length).toBe(2)
    })
  })

  describe('Valid Targets Calculation', () => {
    it('should calculate valid targets for VARCHAR column', () => {
      store.setAvailableTargets(mockDropTargets)

      store.startDrag(mockColumnInfo)

      // VARCHAR should be compatible with string targets (label, description, statement)
      // but not with time targets (qualifier)
      expect(store.validDropTargets).toContain('item.terms.labels.en')
      expect(store.validDropTargets).toContain('item.terms.descriptions.en')
      expect(store.validDropTargets).toContain('item.statements[0].value')
      expect(store.validDropTargets).not.toContain('item.statements[0].qualifiers[0].value')
    })

    it('should calculate valid targets for INTEGER column', () => {
      const integerColumn: ColumnInfo = {
        name: 'age',
        dataType: 'INTEGER',
        sampleValues: ['25', '30'],
        nullable: false,
      }

      const quantityTarget: DropTarget = {
        type: 'statement',
        path: 'item.statements[1].value',
        acceptedTypes: ['quantity'],
        propertyId: 'P2067',
      }

      store.setAvailableTargets([...mockDropTargets, quantityTarget])
      store.startDrag(integerColumn)

      // INTEGER should only be compatible with quantity targets
      expect(store.validDropTargets).toContain('item.statements[1].value')
      expect(store.validDropTargets).not.toContain('item.terms.labels.en')
      expect(store.validDropTargets).not.toContain('item.statements[0].value')
    })

    it('should reject nullable columns for required targets', () => {
      const nullableColumn: ColumnInfo = {
        ...mockColumnInfo,
        nullable: true,
      }

      store.setAvailableTargets(mockDropTargets)
      store.startDrag(nullableColumn)

      // Should not include the required statement target
      expect(store.validDropTargets).toContain('item.terms.labels.en')
      expect(store.validDropTargets).toContain('item.terms.descriptions.en')
      expect(store.validDropTargets).not.toContain('item.statements[0].value') // This is required
    })

    it('should reject targets without property IDs for statements/qualifiers/references', () => {
      const targetWithoutProperty: DropTarget = {
        type: 'statement',
        path: 'item.statements[2].value',
        acceptedTypes: ['string'],
        // Missing propertyId
      }

      store.setAvailableTargets([...mockDropTargets, targetWithoutProperty])
      store.startDrag(mockColumnInfo)

      // Should not include the target without property ID
      expect(store.validDropTargets).not.toContain('item.statements[2].value')
    })

    it('should reject long values for label/alias targets', () => {
      const longValueColumn: ColumnInfo = {
        name: 'long_text',
        dataType: 'VARCHAR',
        sampleValues: ['a'.repeat(300)], // Very long value
        nullable: false,
      }

      store.setAvailableTargets(mockDropTargets)
      store.startDrag(longValueColumn)

      // Should not include label targets due to length constraint
      expect(store.validDropTargets).not.toContain('item.terms.labels.en')
      // But should include description (which has higher length limit)
      expect(store.validDropTargets).toContain('item.terms.descriptions.en')
    })
  })

  describe('Computed Properties', () => {
    it('should compute isDragging correctly - drag,drop,idle', () => {
      expect(store.isDragging).toBeFalse()

      store.setDragState('dragging')
      expect(store.isDragging).toBeTrue()

      store.setDragState('dropping')
      expect(store.isDragging).toBeFalse()

      store.setDragState('idle')
      expect(store.isDragging).toBeFalse()
    })

    it('should compute isDropping correctly - drop,drag,idle', () => {
      expect(store.isDropping).toBeFalse()

      store.setDragState('dropping')
      expect(store.isDropping).toBeTrue()

      store.setDragState('dragging')
      expect(store.isDropping).toBeFalse()

      store.setDragState('idle')
      expect(store.isDropping).toBeFalse()
    })

    it('should compute hasValidTargets correctly', () => {
      expect(store.hasValidTargets).toBeFalse()

      store.setAvailableTargets(mockDropTargets)
      store.startDrag(mockColumnInfo)

      expect(store.hasValidTargets).toBeTrue()

      store.endDrag()
      expect(store.hasValidTargets).toBeFalse()
    })
  })

  describe('Store Reset', () => {
    it('should reset store to initial state', () => {
      // Set up some state
      store.setAvailableTargets(mockDropTargets)
      store.startDrag(mockColumnInfo)
      store.setHoveredTarget('item.terms.labels.en')

      // Verify state is set
      expect(store.draggedColumn).not.toBeNull()
      expect(store.dragState).toBe('dragging')
      expect(store.validDropTargets.length).toBeGreaterThan(0)
      expect(store.hoveredTarget).not.toBeNull()
      expect(store.availableTargets.length).toBeGreaterThan(0)

      // Reset
      store.$reset()

      // Verify reset to initial state
      expect(store.draggedColumn).toBeNull()
      expect(store.dragState).toBe('idle')
      expect(store.validDropTargets).toEqual([])
      expect(store.hoveredTarget).toBeNull()
      expect(store.availableTargets).toEqual([])
      expect(store.isDragging).toBeFalse()
      expect(store.isDropping).toBeFalse()
      expect(store.hasValidTargets).toBeFalse()
    })
  })

  describe('Data Type Compatibility', () => {
    it('should handle all supported data types', () => {
      const testCases: { dataType: string; expectedTargets: WikibaseDataType[] }[] = [
        {
          dataType: 'VARCHAR',
          expectedTargets: ['string', 'url', 'external-id', 'monolingualtext'],
        },
        { dataType: 'TEXT', expectedTargets: ['string', 'monolingualtext'] },
        { dataType: 'INTEGER', expectedTargets: ['quantity'] },
        { dataType: 'DECIMAL', expectedTargets: ['quantity'] },
        { dataType: 'DATE', expectedTargets: ['time'] },
        { dataType: 'DATETIME', expectedTargets: ['time'] },
        { dataType: 'JSON', expectedTargets: ['string'] },
        { dataType: 'ARRAY', expectedTargets: ['string'] },
      ]

      testCases.forEach(({ dataType, expectedTargets }) => {
        const columnInfo: ColumnInfo = {
          name: `test_${dataType.toLowerCase()}`,
          dataType,
          sampleValues: ['test'],
          nullable: false,
        }

        const targets: DropTarget[] = expectedTargets.map((type, index) => ({
          type: 'statement',
          path: `item.statements[${index}].value`,
          acceptedTypes: [type],
          propertyId: `P${index + 1}`,
        }))

        store.setAvailableTargets(targets)
        store.startDrag(columnInfo)

        expect(store.validDropTargets.length).toBe(expectedTargets.length)
        store.endDrag()
      })
    })

    it('should handle unsupported data types', () => {
      const unsupportedColumn: ColumnInfo = {
        name: 'unsupported',
        dataType: 'UNKNOWN_TYPE',
        sampleValues: ['test'],
        nullable: false,
      }

      store.setAvailableTargets(mockDropTargets)
      store.startDrag(unsupportedColumn)

      // Should have no valid targets for unsupported data type
      expect(store.validDropTargets).toEqual([])
      expect(store.hasValidTargets).toBeFalse()
    })
  })

  describe('New Computed Properties', () => {
    it('should compute validDropTargetsAsObjects correctly', () => {
      store.setAvailableTargets(mockDropTargets)

      // Initially no valid targets
      expect(store.validDropTargetsAsObjects).toEqual([])

      // Start dragging
      store.startDrag(mockColumnInfo)

      // Should have valid targets as objects
      expect(store.validDropTargetsAsObjects.length).toBeGreaterThan(0)
      expect(store.validDropTargetsAsObjects[0]).toHaveProperty('type')
      expect(store.validDropTargetsAsObjects[0]).toHaveProperty('path')
      expect(store.validDropTargetsAsObjects[0]).toHaveProperty('acceptedTypes')
    })

    it('should compute isValidDrop correctly', () => {
      store.setAvailableTargets(mockDropTargets)

      // Initially not valid
      expect(store.isValidDrop).toBeFalse()

      // Start drag
      store.startDrag(mockColumnInfo)

      // Still not valid (no hovered target)
      expect(store.isValidDrop).toBeFalse()

      // Set valid hovered target
      store.setHoveredTarget('item.terms.labels.en')

      // Now should be valid
      expect(store.isValidDrop).toBeTrue()

      // Set invalid hovered target
      store.setHoveredTarget('item.statements[0].qualifiers[0].value') // time type, incompatible with VARCHAR

      // Should be invalid
      expect(store.isValidDrop).toBeFalse()
    })
  })
})
