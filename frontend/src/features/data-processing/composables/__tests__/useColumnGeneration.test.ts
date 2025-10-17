import { describe, expect, it } from 'bun:test'
import type { DuckDBColumnSchema } from '@backend/api/project/schemas'
import { useColumnGeneration } from '@frontend/features/data-processing/composables/useColumnGeneration'

describe('useColumnGeneration', () => {
  const { generateColumns } = useColumnGeneration()

  describe('generateColumns', () => {
    it('should generate columns from schema with correct properties', () => {
      const schema: DuckDBColumnSchema = [
        { name: 'id', type: 'BIGINT', pk: true },
        { name: 'name', type: 'VARCHAR', pk: false },
        { name: 'created_at', type: 'date', pk: false },
      ]

      const result = generateColumns(schema)

      expect(result).toEqual([
        {
          field: 'id',
          header: 'id',
          type: 'BIGINT',
          pk: true,
          isInteger: true,
          isDate: false,
        },
        {
          field: 'name',
          header: 'name',
          type: 'VARCHAR',
          pk: false,
          isInteger: false,
          isDate: false,
        },
        {
          field: 'created_at',
          header: 'created_at',
          type: 'date',
          pk: false,
          isInteger: false,
          isDate: true,
        },
      ])
    })

    it('should sort primary key columns first', () => {
      const schema: DuckDBColumnSchema = [
        { name: 'name', type: 'VARCHAR', pk: false },
        { name: 'id', type: 'BIGINT', pk: true },
        { name: 'email', type: 'VARCHAR', pk: false },
        { name: 'user_id', type: 'BIGINT', pk: true },
      ]

      const result = generateColumns(schema)

      expect(result).toEqual([
        {
          field: 'id',
          header: 'id',
          type: 'BIGINT',
          pk: true,
          isInteger: true,
          isDate: false,
        },
        {
          field: 'user_id',
          header: 'user_id',
          type: 'BIGINT',
          pk: true,
          isInteger: true,
          isDate: false,
        },
        {
          field: 'name',
          header: 'name',
          type: 'VARCHAR',
          pk: false,
          isInteger: false,
          isDate: false,
        },
        {
          field: 'email',
          header: 'email',
          type: 'VARCHAR',
          pk: false,
          isInteger: false,
          isDate: false,
        },
      ])
    })

    it('should handle empty schema', () => {
      const schema: DuckDBColumnSchema = []

      const result = generateColumns(schema)

      expect(result).toHaveLength(0)
      expect(result).toEqual([])
    })

    it('should correctly identify integer types', () => {
      const schema: DuckDBColumnSchema = [
        { name: 'bigint_col', type: 'BIGINT', pk: false },
        { name: 'varchar_col', type: 'VARCHAR', pk: false },
        { name: 'int_col', type: 'INTEGER', pk: false },
      ]

      const result = generateColumns(schema)

      expect(result).toEqual([
        {
          field: 'bigint_col',
          header: 'bigint_col',
          type: 'BIGINT',
          pk: false,
          isInteger: true,
          isDate: false,
        },
        {
          field: 'varchar_col',
          header: 'varchar_col',
          type: 'VARCHAR',
          pk: false,
          isInteger: false,
          isDate: false,
        },
        {
          field: 'int_col',
          header: 'int_col',
          type: 'INTEGER',
          pk: false,
          isInteger: true,
          isDate: false,
        },
      ])
    })

    it('should correctly identify date types', () => {
      const schema: DuckDBColumnSchema = [
        { name: 'date_col', type: 'date', pk: false },
        { name: 'datetime_col', type: 'DATETIME', pk: false },
        { name: 'varchar_col', type: 'VARCHAR', pk: false },
      ]

      const result = generateColumns(schema)

      expect(result).toEqual([
        {
          field: 'date_col',
          header: 'date_col',
          type: 'date',
          pk: false,
          isInteger: false,
          isDate: true,
        },
        {
          field: 'datetime_col',
          header: 'datetime_col',
          type: 'DATETIME',
          pk: false,
          isInteger: false,
          isDate: true,
        },
        {
          field: 'varchar_col',
          header: 'varchar_col',
          type: 'VARCHAR',
          pk: false,
          isInteger: false,
          isDate: false,
        },
      ])
    })

    it('should maintain original order for non-primary key columns', () => {
      const schema: DuckDBColumnSchema = [
        { name: 'z_column', type: 'VARCHAR', pk: false },
        { name: 'a_column', type: 'VARCHAR', pk: false },
        { name: 'm_column', type: 'VARCHAR', pk: false },
      ]

      const result = generateColumns(schema)

      expect(result).toEqual([
        {
          field: 'z_column',
          header: 'z_column',
          type: 'VARCHAR',
          pk: false,
          isInteger: false,
          isDate: false,
        },
        {
          field: 'a_column',
          header: 'a_column',
          type: 'VARCHAR',
          pk: false,
          isInteger: false,
          isDate: false,
        },
        {
          field: 'm_column',
          header: 'm_column',
          type: 'VARCHAR',
          pk: false,
          isInteger: false,
          isDate: false,
        },
      ])
    })

    it('should handle mixed primary key and non-primary key columns', () => {
      const schema: DuckDBColumnSchema = [
        { name: 'description', type: 'TEXT', pk: false },
        { name: 'id', type: 'BIGINT', pk: true },
        { name: 'status', type: 'VARCHAR', pk: false },
        { name: 'tenant_id', type: 'BIGINT', pk: true },
        { name: 'created_at', type: 'date', pk: false },
      ]

      const result = generateColumns(schema)

      expect(result).toEqual([
        {
          field: 'id',
          header: 'id',
          type: 'BIGINT',
          pk: true,
          isInteger: true,
          isDate: false,
        },
        {
          field: 'tenant_id',
          header: 'tenant_id',
          type: 'BIGINT',
          pk: true,
          isInteger: true,
          isDate: false,
        },
        {
          field: 'description',
          header: 'description',
          type: 'TEXT',
          pk: false,
          isInteger: false,
          isDate: false,
        },
        {
          field: 'status',
          header: 'status',
          type: 'VARCHAR',
          pk: false,
          isInteger: false,
          isDate: false,
        },
        {
          field: 'created_at',
          header: 'created_at',
          type: 'date',
          pk: false,
          isInteger: false,
          isDate: true,
        },
      ])
    })
  })
})
