import type { PropertyReference, ValueMapping } from '@backend/api/project/project.wikibase'
import { useStatementValidationDisplay } from '@frontend/features/wikibase-schema/composables/useStatementValidationDisplay'
import { beforeEach, describe, expect, test } from 'bun:test'
import { ref } from 'vue'

describe('useStatementValidationDisplay', () => {
  let testProperty: PropertyReference
  let testValueMapping: ValueMapping

  beforeEach(() => {
    testProperty = {
      id: 'P1476',
      label: 'title',
      dataType: 'string',
    }

    testValueMapping = {
      type: 'column',
      source: { columnName: 'title', dataType: 'VARCHAR' },
      dataType: 'string',
    }
  })

  describe('getValidationMessage', () => {
    test('should return null for valid statement', () => {
      const { getValidationMessage } = useStatementValidationDisplay()

      const message = getValidationMessage(testValueMapping, testProperty)

      expect(message).toBeNull()
    })

    test('should return error message for incompatible data types', () => {
      const { getValidationMessage } = useStatementValidationDisplay()

      const invalidMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'population', dataType: 'INTEGER' },
        dataType: 'string',
      }

      const message = getValidationMessage(invalidMapping, testProperty)

      expect(message).not.toBeNull()
      expect(message?.type).toBe('error')
      expect(message?.message).toContain('not compatible')
      expect(message?.suggestions).toBeDefined()
    })

    test('should return warning message for suboptimal mappings', () => {
      const { getValidationMessage } = useStatementValidationDisplay()

      const suboptimalMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'title', dataType: 'VARCHAR' },
        dataType: 'external-id',
      }

      const externalIdProperty: PropertyReference = {
        id: 'P213',
        label: 'ISNI',
        dataType: 'external-id',
      }

      const message = getValidationMessage(suboptimalMapping, externalIdProperty)

      expect(message?.type).toBe('warning')
      expect(message?.message).toContain('may not be optimal')
    })

    test('should handle missing property', () => {
      const { getValidationMessage } = useStatementValidationDisplay()

      const message = getValidationMessage(testValueMapping, null)

      expect(message?.type).toBe('error')
      expect(message?.message).toContain('property')
    })

    test('should handle missing column source', () => {
      const { getValidationMessage } = useStatementValidationDisplay()

      const emptyMapping: ValueMapping = {
        type: 'column',
        source: { columnName: '', dataType: 'VARCHAR' },
        dataType: 'string',
      }

      const message = getValidationMessage(emptyMapping, testProperty)

      expect(message?.type).toBe('error')
      expect(message?.message).toContain('value mapping')
    })

    test('should not validate constant values', () => {
      const { getValidationMessage } = useStatementValidationDisplay()

      const constantMapping: ValueMapping = {
        type: 'constant',
        source: 'Q5',
        dataType: 'wikibase-item',
      }

      const message = getValidationMessage(constantMapping, testProperty)

      expect(message).toBeNull()
    })

    test('should not validate expression values', () => {
      const { getValidationMessage } = useStatementValidationDisplay()

      const expressionMapping: ValueMapping = {
        type: 'expression',
        source: 'CONCAT("https://example.com/", id)',
        dataType: 'url',
      }

      const message = getValidationMessage(expressionMapping, testProperty)

      expect(message).toBeNull()
    })
  })

  describe('getValidationClasses', () => {
    test('should return neutral classes for valid statement', () => {
      const { getValidationClasses } = useStatementValidationDisplay()

      const classes = getValidationClasses(testValueMapping, testProperty)

      expect(classes).toContain('border-surface-200')
      expect(classes).not.toContain('border-red-300')
      expect(classes).not.toContain('border-yellow-300')
    })

    test('should return error classes for invalid statement', () => {
      const { getValidationClasses } = useStatementValidationDisplay()

      const invalidMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'population', dataType: 'INTEGER' },
        dataType: 'string',
      }

      const classes = getValidationClasses(invalidMapping, testProperty)

      expect(classes).toContain('border-red-300')
      expect(classes).toContain('bg-red-50')
    })

    test('should return warning classes for suboptimal statement', () => {
      const { getValidationClasses } = useStatementValidationDisplay()

      const suboptimalMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'title', dataType: 'VARCHAR' },
        dataType: 'external-id',
      }

      const externalIdProperty: PropertyReference = {
        id: 'P213',
        label: 'ISNI',
        dataType: 'external-id',
      }

      const classes = getValidationClasses(suboptimalMapping, externalIdProperty)

      expect(classes).toContain('border-yellow-300')
      expect(classes).toContain('bg-yellow-50')
    })
  })

  describe('getValidationIcon', () => {
    test('should return null for valid statement', () => {
      const { getValidationIcon } = useStatementValidationDisplay()

      const icon = getValidationIcon(testValueMapping, testProperty)

      expect(icon).toBeNull()
    })

    test('should return error icon for invalid statement', () => {
      const { getValidationIcon } = useStatementValidationDisplay()

      const invalidMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'population', dataType: 'INTEGER' },
        dataType: 'string',
      }

      const icon = getValidationIcon(invalidMapping, testProperty)

      expect(icon?.icon).toBe('pi pi-times-circle')
      expect(icon?.class).toContain('text-red-500')
    })

    test('should return warning icon for suboptimal statement', () => {
      const { getValidationIcon } = useStatementValidationDisplay()

      const suboptimalMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'title', dataType: 'VARCHAR' },
        dataType: 'external-id',
      }

      const externalIdProperty: PropertyReference = {
        id: 'P213',
        label: 'ISNI',
        dataType: 'external-id',
      }

      const icon = getValidationIcon(suboptimalMapping, externalIdProperty)

      expect(icon?.icon).toBe('pi pi-exclamation-triangle')
      expect(icon?.class).toContain('text-yellow-500')
    })
  })

  describe('reactive validation', () => {
    test('should reactively update validation when value mapping changes', () => {
      const { getValidationMessage } = useStatementValidationDisplay()

      const reactiveMapping = ref<ValueMapping>({
        type: 'column',
        source: { columnName: 'title', dataType: 'VARCHAR' },
        dataType: 'string',
      })

      // Initially valid
      let message = getValidationMessage(reactiveMapping.value, testProperty)
      expect(message).toBeNull()

      // Change to invalid mapping
      reactiveMapping.value = {
        type: 'column',
        source: { columnName: 'population', dataType: 'INTEGER' },
        dataType: 'string',
      }

      message = getValidationMessage(reactiveMapping.value, testProperty)
      expect(message?.type).toBe('error')
    })

    test('should reactively update validation when property changes', () => {
      const { getValidationMessage } = useStatementValidationDisplay()

      const reactiveProperty = ref<PropertyReference | null>(testProperty)

      // Initially valid
      let message = getValidationMessage(testValueMapping, reactiveProperty.value)
      expect(message).toBeNull()

      // Change to null property
      reactiveProperty.value = null

      message = getValidationMessage(testValueMapping, reactiveProperty.value)
      expect(message?.type).toBe('error')
    })
  })
})
