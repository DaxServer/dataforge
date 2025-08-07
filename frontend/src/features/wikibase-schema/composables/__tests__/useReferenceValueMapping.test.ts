import { describe, test, expect } from 'bun:test'
import { useReferenceValueMapping } from '@frontend/features/wikibase-schema/composables/useReferenceValueMapping'
import type { ColumnInfo } from '@frontend/shared/types/wikibase-schema'
import type {
  ReferenceSchemaMapping,
  PropertyValueMap,
} from '@backend/api/project/project.wikibase'
import type { UUID } from 'crypto'

const TEST_REFERENCE_ID: UUID = Bun.randomUUIDv7() as UUID

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

    const columnInfo: ColumnInfo = {
      name: 'test_column',
      dataType: 'VARCHAR',
      sampleValues: [],
      nullable: false,
    }

    const mapping = createReferenceValueMappingFromColumn(columnInfo, 'string')

    expect(mapping.type).toBe('column')
    expect(mapping.source).toEqual({
      columnName: 'test_column',
      dataType: 'VARCHAR',
    })
  })

  test('should create citation reference', () => {
    const { createCitationReference } = useReferenceValueMapping()

    const snaks: PropertyValueMap[] = [
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

    const validSnak: PropertyValueMap = {
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
      id: TEST_REFERENCE_ID,
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
