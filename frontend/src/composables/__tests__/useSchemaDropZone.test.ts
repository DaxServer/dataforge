import { describe, test, expect, beforeEach } from 'bun:test'
import { createPinia, setActivePinia } from 'pinia'
import { useSchemaDropZone } from '@frontend/composables/useSchemaDropZone'
import { useDragDropStore } from '@frontend/stores/drag-drop.store'
import { useSchemaStore } from '@frontend/stores/schema.store'
import type { ColumnInfo } from '@frontend/types/wikibase-schema'

describe('useSchemaDropZone Composable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initialization', () => {
    test('should initialize with default state', () => {
      const {
        isOverDropZone,
        isValidDropState,
        isInvalidDropState,
        dropZoneClasses,
        setTermType,
        setLanguageCode,
      } = useSchemaDropZone()

      setTermType('label')
      setLanguageCode('en')

      expect(isOverDropZone.value).toBe(false)
      expect(isValidDropState.value).toBe(false)
      expect(isInvalidDropState.value).toBe(false)
      expect(dropZoneClasses.value['border-primary-400 bg-primary-50']).toBe(false)
      expect(dropZoneClasses.value['border-green-400 bg-green-50']).toBe(false)
      expect(dropZoneClasses.value['border-red-400 bg-red-50']).toBe(false)
    })
  })

  describe('drag state reactivity', () => {
    test('should update isValidDropState when valid column is dragged', () => {
      const dragDropStore = useDragDropStore()
      const { isValidDropState, setTermType, setLanguageCode } = useSchemaDropZone()

      setTermType('label')
      setLanguageCode('en')

      expect(isValidDropState.value).toBe(false)

      const validColumn: ColumnInfo = {
        name: 'title',
        dataType: 'VARCHAR',
        sampleValues: ['Sample'],
        nullable: false,
      }

      dragDropStore.startDrag(validColumn)

      expect(isValidDropState.value).toBe(true)
    })

    test('should update isInvalidDropState when invalid column is dragged', () => {
      const dragDropStore = useDragDropStore()
      const { isInvalidDropState, setTermType, setLanguageCode } = useSchemaDropZone()

      setTermType('label')
      setLanguageCode('en')

      expect(isInvalidDropState.value).toBe(false)

      const invalidColumn: ColumnInfo = {
        name: 'count',
        dataType: 'INTEGER',
        sampleValues: ['123'],
        nullable: false,
      }

      dragDropStore.startDrag(invalidColumn)

      expect(isInvalidDropState.value).toBe(true)
    })

    test('should treat duplicate alias as invalid drop', () => {
      const dragDropStore = useDragDropStore()
      const {
        isValidDropState,
        isInvalidDropState,
        addColumnMapping,
        setTermType,
        setLanguageCode,
      } = useSchemaDropZone()

      setTermType('alias')
      setLanguageCode('en')

      const columnData: ColumnInfo = {
        name: 'alias_column',
        dataType: 'VARCHAR',
        sampleValues: ['Sample'],
        nullable: false,
      }

      // Add the column first
      addColumnMapping(columnData)

      // Now try to drag the same column again
      dragDropStore.startDrag(columnData)

      expect(isValidDropState.value).toBe(false)
      expect(isInvalidDropState.value).toBe(true)
    })

    test('should update dropZoneClasses based on drag state', () => {
      const dragDropStore = useDragDropStore()
      const { dropZoneClasses, setTermType, setLanguageCode } = useSchemaDropZone()

      setTermType('label')
      setLanguageCode('en')

      const validColumn: ColumnInfo = {
        name: 'title',
        dataType: 'VARCHAR',
        sampleValues: ['Sample'],
        nullable: false,
      }

      dragDropStore.startDrag(validColumn)

      expect(dropZoneClasses.value['border-green-400 bg-green-50']).toBe(true)
      expect(dropZoneClasses.value['border-red-400 bg-red-50']).toBe(false)

      const invalidColumn: ColumnInfo = {
        name: 'count',
        dataType: 'INTEGER',
        sampleValues: ['123'],
        nullable: false,
      }

      dragDropStore.startDrag(invalidColumn)

      expect(dropZoneClasses.value['border-green-400 bg-green-50']).toBe(false)
      expect(dropZoneClasses.value['border-red-400 bg-red-50']).toBe(true)
    })
  })

  describe('drag event handlers', () => {
    test('should handle drag over event with valid column', () => {
      const dragDropStore = useDragDropStore()
      const { handleDragOver, setTermType, setLanguageCode } = useSchemaDropZone()

      setTermType('label')
      setLanguageCode('en')

      // Set up a valid text column
      const validColumn: ColumnInfo = {
        name: 'test_column',
        dataType: 'TEXT',
        nullable: false,
        sampleValues: ['sample1', 'sample2'],
        uniqueCount: 2,
      }
      dragDropStore.startDrag(validColumn)

      const mockEvent = {
        preventDefault: () => {},
        dataTransfer: {
          dropEffect: '',
        },
      } as unknown as DragEvent

      expect(() => handleDragOver(mockEvent)).not.toThrow()
      expect(mockEvent.dataTransfer!.dropEffect).toBe('copy')
    })

    test('should handle drag over event with invalid column', () => {
      const dragDropStore = useDragDropStore()
      const { handleDragOver, setTermType, setLanguageCode } = useSchemaDropZone()

      setTermType('label')
      setLanguageCode('en')

      // Set up an invalid column (non-text type)
      const invalidColumn: ColumnInfo = {
        name: 'test_column',
        dataType: 'INTEGER',
        nullable: false,
        sampleValues: ['1', '2'],
        uniqueCount: 2,
      }
      dragDropStore.startDrag(invalidColumn)

      const mockEvent = {
        preventDefault: () => {},
        dataTransfer: {
          dropEffect: '',
        },
      } as unknown as DragEvent

      expect(() => handleDragOver(mockEvent)).not.toThrow()
      expect(mockEvent.dataTransfer!.dropEffect).toBe('none')
    })

    test('should handle drag over event with no dragged column', () => {
      const { handleDragOver, setTermType, setLanguageCode } = useSchemaDropZone()

      setTermType('label')
      setLanguageCode('en')

      const mockEvent = {
        preventDefault: () => {},
        dataTransfer: {
          dropEffect: '',
        },
      } as unknown as DragEvent

      expect(() => handleDragOver(mockEvent)).not.toThrow()
      expect(mockEvent.dataTransfer!.dropEffect).toBe('none')
    })

    test('should show none cursor for duplicate alias column', () => {
      const dragDropStore = useDragDropStore()
      const { handleDragOver, addColumnMapping, setTermType, setLanguageCode } = useSchemaDropZone()

      setTermType('alias')
      setLanguageCode('en')

      const columnData: ColumnInfo = {
        name: 'alias_column',
        dataType: 'VARCHAR',
        nullable: false,
        sampleValues: ['sample'],
        uniqueCount: 1,
      }

      // Add the column first
      addColumnMapping(columnData)

      // Now try to drag the same column again
      dragDropStore.startDrag(columnData)

      const mockEvent = {
        preventDefault: () => {},
        dataTransfer: {
          dropEffect: '',
        },
      } as unknown as DragEvent

      handleDragOver(mockEvent)

      expect(mockEvent.dataTransfer!.dropEffect).toBe('none')
    })

    test('should handle drag enter event', () => {
      const { handleDragEnter, isOverDropZone, setTermType, setLanguageCode } = useSchemaDropZone()

      setTermType('label')
      setLanguageCode('en')

      expect(isOverDropZone.value).toBe(false)

      handleDragEnter()

      expect(isOverDropZone.value).toBe(true)
    })

    test('should handle drag leave event', () => {
      const { handleDragLeave, isOverDropZone, setTermType, setLanguageCode } = useSchemaDropZone()

      setTermType('label')
      setLanguageCode('en')

      isOverDropZone.value = true

      handleDragLeave()

      expect(isOverDropZone.value).toBe(false)
    })

    test('should handle drop event with valid column data', () => {
      const schemaStore = useSchemaStore()
      const dragDropStore = useDragDropStore()
      const { handleDrop, isOverDropZone, setTermType, setLanguageCode } = useSchemaDropZone()

      setTermType('label')
      setLanguageCode('en')

      isOverDropZone.value = true

      const columnData = {
        name: 'title',
        dataType: 'VARCHAR',
        sampleValues: ['Sample'],
        nullable: false,
      }

      // Set up drag state before calling handleDrop
      dragDropStore.startDrag(columnData)

      const mockEvent = {
        preventDefault: () => {},
        dataTransfer: {
          getData: (type: string) => {
            if (type === 'application/x-column-data') {
              return JSON.stringify(columnData)
            }
            return ''
          },
        },
      } as unknown as DragEvent

      handleDrop(mockEvent)

      expect(isOverDropZone.value).toBe(false)
      expect(schemaStore.labels.en).toBeDefined()
      expect(schemaStore.labels.en?.columnName).toBe('title')
      expect(schemaStore.labels.en?.dataType).toBe('VARCHAR')
    })

    test('should handle drop event with invalid column data', () => {
      const schemaStore = useSchemaStore()
      const dragDropStore = useDragDropStore()
      const { handleDrop, setTermType, setLanguageCode } = useSchemaDropZone()

      setTermType('label')
      setLanguageCode('en')

      const columnData = {
        name: 'count',
        dataType: 'INTEGER',
        sampleValues: ['123'],
        nullable: false,
      }

      // Set up drag state before calling handleDrop
      dragDropStore.startDrag(columnData)

      const mockEvent = {
        preventDefault: () => {},
        dataTransfer: {
          getData: (type: string) => {
            if (type === 'application/x-column-data') {
              return JSON.stringify(columnData)
            }
            return ''
          },
        },
      } as DragEvent

      handleDrop(mockEvent)

      expect(schemaStore.labels.en).toBeUndefined()
    })
  })

  describe('term type specific behavior', () => {
    test('should add label mapping for label term type', () => {
      const schemaStore = useSchemaStore()
      const { addColumnMapping, setTermType, setLanguageCode } = useSchemaDropZone()

      setTermType('label')
      setLanguageCode('en')

      const columnData: ColumnInfo = {
        name: 'title',
        dataType: 'VARCHAR',
        sampleValues: ['Sample'],
        nullable: false,
      }

      addColumnMapping(columnData)

      expect(schemaStore.labels.en).toBeDefined()
      expect(schemaStore.labels.en?.columnName).toBe('title')
      expect(schemaStore.labels.en?.dataType).toBe('VARCHAR')
    })

    test('should add description mapping for description term type', () => {
      const schemaStore = useSchemaStore()
      const { addColumnMapping, setTermType, setLanguageCode } = useSchemaDropZone()

      setTermType('description')
      setLanguageCode('en')

      const columnData: ColumnInfo = {
        name: 'description',
        dataType: 'TEXT',
        sampleValues: ['Sample'],
        nullable: false,
      }

      addColumnMapping(columnData)

      expect(schemaStore.descriptions.en).toBeDefined()
      expect(schemaStore.descriptions.en?.columnName).toBe('description')
      expect(schemaStore.descriptions.en?.dataType).toBe('TEXT')
    })

    test('should add alias mapping for alias term type', () => {
      const schemaStore = useSchemaStore()
      const { addColumnMapping, setTermType, setLanguageCode } = useSchemaDropZone()

      setTermType('alias')
      setLanguageCode('en')

      const columnData: ColumnInfo = {
        name: 'alias',
        dataType: 'VARCHAR',
        sampleValues: ['Sample'],
        nullable: false,
      }

      addColumnMapping(columnData)

      expect(schemaStore.aliases.en).toBeDefined()
      expect(schemaStore.aliases.en).toHaveLength(1)
      expect(schemaStore.aliases.en?.[0]?.columnName).toBe('alias')
      expect(schemaStore.aliases.en?.[0]?.dataType).toBe('VARCHAR')
    })

    test('should prevent duplicate alias mappings for the same language', () => {
      const schemaStore = useSchemaStore()
      const { addColumnMapping, setTermType, setLanguageCode } = useSchemaDropZone()

      setTermType('alias')
      setLanguageCode('en')

      const columnData: ColumnInfo = {
        name: 'alias_column',
        dataType: 'VARCHAR',
        sampleValues: ['Sample'],
        nullable: false,
      }

      // Add the same column twice
      addColumnMapping(columnData)
      addColumnMapping(columnData)

      // Should only have one mapping
      expect(schemaStore.aliases.en).toBeDefined()
      expect(schemaStore.aliases.en).toHaveLength(1)
      expect(schemaStore.aliases.en?.[0]?.columnName).toBe('alias_column')
    })

    test('should allow same column for different languages in aliases', () => {
      const schemaStore = useSchemaStore()
      const enAliasZone = useSchemaDropZone()
      const frAliasZone = useSchemaDropZone()

      enAliasZone.setTermType('alias')
      enAliasZone.setLanguageCode('en')
      frAliasZone.setTermType('alias')
      frAliasZone.setLanguageCode('fr')

      const columnData: ColumnInfo = {
        name: 'alias_column',
        dataType: 'VARCHAR',
        sampleValues: ['Sample'],
        nullable: false,
      }

      // Add the same column to different languages
      enAliasZone.addColumnMapping(columnData)
      frAliasZone.addColumnMapping(columnData)

      // Should have mappings for both languages
      expect(schemaStore.aliases.en).toHaveLength(1)
      expect(schemaStore.aliases.fr).toHaveLength(1)
      expect(schemaStore.aliases.en?.[0]?.columnName).toBe('alias_column')
      expect(schemaStore.aliases.fr?.[0]?.columnName).toBe('alias_column')
    })
  })

  describe('hover state management', () => {
    test('should update dropZoneClasses when hovering over drop zone', () => {
      const { dropZoneClasses, isOverDropZone, setTermType, setLanguageCode } = useSchemaDropZone()

      setTermType('label')
      setLanguageCode('en')

      expect(dropZoneClasses.value['border-primary-400 bg-primary-50']).toBe(false)

      isOverDropZone.value = true

      expect(dropZoneClasses.value['border-primary-400 bg-primary-50']).toBe(true)
    })

    test('should combine hover and drag states in dropZoneClasses', () => {
      const dragDropStore = useDragDropStore()
      const { dropZoneClasses, isOverDropZone, setTermType, setLanguageCode } = useSchemaDropZone()

      setTermType('label')
      setLanguageCode('en')

      const validColumn: ColumnInfo = {
        name: 'title',
        dataType: 'VARCHAR',
        sampleValues: ['Sample'],
        nullable: false,
      }

      dragDropStore.startDrag(validColumn)
      isOverDropZone.value = true

      expect(dropZoneClasses.value['border-primary-400 bg-primary-50']).toBe(true)
      expect(dropZoneClasses.value['border-green-400 bg-green-50']).toBe(true)
      expect(dropZoneClasses.value['border-red-400 bg-red-50']).toBe(false)
    })
  })
})
