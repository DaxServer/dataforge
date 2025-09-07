import type { DuckDBColumnSchema } from '@backend/api/project/_schemas'
import { DuckDBTypeId } from '@duckdb/node-api'

export type DuckDBTablePragma = {
  cid: number
  name: string
  type: string
  pk: boolean
  notnull: boolean
  dflt_value: string | null
}

export type DuckDBColumnNameAndType = {
  columnName: string
  columnType: {
    typeId: number
    alias?: string
  }
}

export const getTypeFromTypeId = (typeId: number): string => {
  switch (typeId) {
    case DuckDBTypeId.TINYINT:
    case DuckDBTypeId.SMALLINT:
    case DuckDBTypeId.INTEGER:
    case DuckDBTypeId.BIGINT:
    case DuckDBTypeId.UTINYINT:
    case DuckDBTypeId.USMALLINT:
    case DuckDBTypeId.UINTEGER:
    case DuckDBTypeId.UBIGINT:
    case DuckDBTypeId.HUGEINT:
    case DuckDBTypeId.UHUGEINT:
      return 'integer'
    case DuckDBTypeId.FLOAT:
    case DuckDBTypeId.DOUBLE:
    case DuckDBTypeId.DECIMAL:
      return 'number'
    case DuckDBTypeId.BOOLEAN:
      return 'boolean'
    case DuckDBTypeId.DATE:
    case DuckDBTypeId.TIME:
    case DuckDBTypeId.TIMESTAMP:
    case DuckDBTypeId.TIMESTAMP_S:
    case DuckDBTypeId.TIMESTAMP_MS:
    case DuckDBTypeId.TIMESTAMP_NS:
    case DuckDBTypeId.TIMESTAMP_TZ:
      return 'date'
    case DuckDBTypeId.VARCHAR:
    case DuckDBTypeId.BLOB:
    default:
      return 'string'
  }
}

export const enhanceSchemaWithTypes = (schema: DuckDBTablePragma[]): DuckDBColumnSchema => {
  return schema.map((col) => ({
    name: col.name,
    type: col.type,
    pk: col.pk,
  }))
}
