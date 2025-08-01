import { describe, test, expect } from 'bun:test'
import { useReferenceValueMapping } from '@frontend/composables/useReferenceValueMapping'
import type {
  ColumnInfo,
  ReferenceSchemaMapping,
  ReferenceSnakSchemaMapping,
} from '@frontend/types/wikibase-schema'

/**
 * useReferenceValueMapping Composable Tests
 *
 * These tests verify the actual implemented functions in the composable.
 */

describe('useReferenceValueMapping', () => {
  test('should check data type compatibility', () => {
    const { isReferenceDataTypeCompatible } = useReferenceValueMapping()

    expect(isReferenceDataTypeCompatible('VARCHAR', 'url')).toBe(true)
    expect(isReferenceDataTypeCompatible('DATE', 'time')).toBe(true)
    expect(isReferenceDataTypeCompatible('INTEGER', 'url')).toBe(false)
  })

  test('should suggest reference data type', () => {
    const { suggestReferenceDataType } = useReferenceValueMapping()

    const urlColumn: ColumnInfo = {
      name: 'url',
      dataType: 'VARCHAR',
      sampleValues: ['https://example.com'],
      nullable: false,
    }

    expect(suggestReferenceDataType(urlColumn, 'url')).toBe('url')
  })

  test('should create reference value mapping from column', () => {
    const { createReferenceValueMappingFromColumn } = useReferenceValueMapping()

    const column: ColumnInfo = {
      name: 'test_column',
      dataType: 'VARCHAR',
      sampleValues: [],
      nullable: false,
    }

    const mapping = createReferenceValueMappingFromColumn(column, 'string')

    expect(mapping.type).toBe('column')
    expect(mapping.source).toEqual({
      columnName: 'test_column',
      dataType: 'VARCHAR',
    })
  })

  test('should create citation reference', () => {
    const { createCitationReference } = useReferenceValueMapping()

    const snaks: ReferenceSnakSchemaMapping[] = [
      {
        property: {
          id: 'P123',
          label: 'test property',
          dataType: 'string',
        },
        value: {
          type: 'column',
          source: {
            columnName: 'test_column',
            dataType: 'VARCHAR',
          },
          dataType: 'string',
        },
      },
    ]

    const reference = createCitationReference(snaks)

    expect(reference.id).toBeDefined()
    expect(reference.snaks).toEqual(snaks)
  })

  test('should validate reference snak mapping', () => {
    const { validateReferenceSnakMapping } = useReferenceValueMapping()

    const validSnak: ReferenceSnakSchemaMapping = {
      property: {
        id: 'P123',
        label: 'test property',
        dataType: 'string',
      },
      value: {
        type: 'column',
        source: {
          columnName: 'test_column',
          dataType: 'VARCHAR',
        },
        dataType: 'string',
      },
    }

    const result = validateReferenceSnakMapping(validSnak)
    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual([])
  })

  test('should validate reference mapping', () => {
    const { validateReferenceMapping } = useReferenceValueMapping()

    const validReference: ReferenceSchemaMapping = {
      id: 'test-ref',
      snaks: [
        {
          property: {
            id: 'P123',
            label: 'test property',
            dataType: 'string',
          },
          value: {
            type: 'column',
            source: {
              columnName: 'test_column',
              dataType: 'VARCHAR',
            },
            dataType: 'string',
          },
        },
      ],
    }

    const result = validateReferenceMapping(validReference)
    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual([])
  })
})
