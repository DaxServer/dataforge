import { describe, test, expect } from 'bun:test'
import { useColumnConversion } from '@frontend/features/data-processing/composables/useColumnConversion'
import type { ProjectColumn } from '@frontend/features/data-processing/composables/useColumnGeneration'

describe('useColumnConversion', () => {
  const { convertProjectColumnsToColumnInfo } = useColumnConversion()

  test('should convert ProjectColumn to ColumnInfo correctly', () => {
    const projectColumns: ProjectColumn[] = [
      {
        field: 'name',
        header: 'Name',
        type: 'VARCHAR',
        pk: false,
        isInteger: false,
        isDate: false,
      },
      {
        field: 'age',
        header: 'Age',
        type: 'INTEGER',
        pk: false,
        isInteger: true,
        isDate: false,
      },
    ]

    const sampleData = [
      { name: 'John Doe', age: 25 },
      { name: 'Jane Smith', age: 30 },
      { name: 'Bob Johnson', age: 35 },
    ]

    const result = convertProjectColumnsToColumnInfo(projectColumns, sampleData)

    expect(result).toHaveLength(2)

    // Test first column (name)
    expect(result[0]?.name).toBe('name')
    expect(result[0]?.dataType).toBe('VARCHAR')
    expect(result[0]?.sampleValues).toEqual(['John Doe', 'Jane Smith', 'Bob Johnson'])
    expect(result[0]?.nullable).toBe(false)
    expect(result[0]?.uniqueCount).toBe(3)

    // Test second column (age)
    expect(result[1]?.name).toBe('age')
    expect(result[1]?.dataType).toBe('INTEGER')
    expect(result[1]?.sampleValues).toEqual(['25', '30', '35'])
    expect(result[1]?.nullable).toBe(false)
    expect(result[1]?.uniqueCount).toBe(3)
  })

  test('should handle nullable columns correctly', () => {
    const projectColumns: ProjectColumn[] = [
      {
        field: 'optional_field',
        header: 'Optional Field',
        type: 'VARCHAR',
        pk: false,
        isInteger: false,
        isDate: false,
      },
    ]

    const sampleData = [
      { optional_field: 'value1' },
      { optional_field: null },
      { optional_field: 'value2' },
      { optional_field: undefined },
    ]

    const result = convertProjectColumnsToColumnInfo(projectColumns, sampleData)

    expect(result[0]?.nullable).toBe(true)
    expect(result[0]?.sampleValues).toEqual(['value1', 'value2'])
    expect(result[0]?.uniqueCount).toBe(2) // Only non-null values counted
  })

  test('should handle empty sample data', () => {
    const projectColumns: ProjectColumn[] = [
      {
        field: 'test_field',
        header: 'Test Field',
        type: 'VARCHAR',
        pk: false,
        isInteger: false,
        isDate: false,
      },
    ]

    const result = convertProjectColumnsToColumnInfo(projectColumns, [])

    expect(result[0]?.sampleValues).toEqual([])
    expect(result[0]?.nullable).toBe(false)
    expect(result[0]?.uniqueCount).toBeUndefined()
  })

  test('should limit sample values to first 5 rows', () => {
    const projectColumns: ProjectColumn[] = [
      {
        field: 'test_field',
        header: 'Test Field',
        type: 'VARCHAR',
        pk: false,
        isInteger: false,
        isDate: false,
      },
    ]

    const sampleData = Array.from({ length: 10 }, (_, i) => ({
      test_field: `value${i}`,
    }))

    const result = convertProjectColumnsToColumnInfo(projectColumns, sampleData)

    expect(result[0]?.sampleValues).toHaveLength(5)
    expect(result[0]?.sampleValues).toEqual(['value0', 'value1', 'value2', 'value3', 'value4'])
  })

  test('should remove duplicate sample values', () => {
    const projectColumns: ProjectColumn[] = [
      {
        field: 'category',
        header: 'Category',
        type: 'VARCHAR',
        pk: false,
        isInteger: false,
        isDate: false,
      },
    ]

    const sampleData = [
      { category: 'A' },
      { category: 'B' },
      { category: 'A' },
      { category: 'C' },
      { category: 'B' },
    ]

    const result = convertProjectColumnsToColumnInfo(projectColumns, sampleData)

    expect(result[0]?.sampleValues).toEqual(['A', 'B', 'C'])
    expect(result[0]?.uniqueCount).toBe(3)
  })

  test('should convert all values to strings', () => {
    const projectColumns: ProjectColumn[] = [
      {
        field: 'mixed_field',
        header: 'Mixed Field',
        type: 'VARCHAR',
        pk: false,
        isInteger: false,
        isDate: false,
      },
    ]

    const sampleData = [
      { mixed_field: 123 },
      { mixed_field: true },
      { mixed_field: 'string' },
      { mixed_field: 45.67 },
    ]

    const result = convertProjectColumnsToColumnInfo(projectColumns, sampleData)

    expect(result[0]?.sampleValues).toEqual(['123', 'true', 'string', '45.67'])
    expect(result[0]?.sampleValues.every((val) => typeof val === 'string')).toBe(true)
  })

  test('should handle columns not present in sample data', () => {
    const projectColumns: ProjectColumn[] = [
      {
        field: 'missing_field',
        header: 'Missing Field',
        type: 'VARCHAR',
        pk: false,
        isInteger: false,
        isDate: false,
      },
    ]

    const sampleData = [{ other_field: 'value1' }, { other_field: 'value2' }]

    const result = convertProjectColumnsToColumnInfo(projectColumns, sampleData)

    expect(result[0]?.sampleValues).toEqual([])
    expect(result[0]?.nullable).toBe(true) // All values are undefined, so nullable
    expect(result[0]?.uniqueCount).toBeUndefined()
  })
})
