import type { DuckDBConnection, DuckDBValue } from '@duckdb/node-api'

export interface ColumnOperationParams {
  table: string
  column: string
}

export abstract class ColumnOperationService {
  constructor(protected db: DuckDBConnection) {}

  /**
   * Abstract method that must be implemented by subclasses to perform the specific operation
   * This will be the entry point called from API endpoints
   */
  public abstract performOperation(params: ColumnOperationParams): Promise<number>

  /**
   * Common pattern for column operations:
   * 1. Get original column type
   * 2. Ensure column is string type if needed
   * 3. Count affected rows
   * 4. Perform operation if rows affected
   * 5. Revert column type if no rows affected and type was converted
   */
  protected async executeColumnOperation(
    table: string,
    column: string,
    operation: () => { query: string; params: DuckDBValue[] },
    countAffectedRows: () => Promise<number>,
  ): Promise<number> {
    // Get the original column type before any modifications
    const originalColumnType = await this.getColumnType(table, column)

    // Check if column is string-like, if not, convert it first
    const wasConverted = await this.ensureColumnIsStringType(table, column)

    // Count rows that will be affected before the update
    const affectedRows = await countAffectedRows()

    // Only proceed if there are rows to update
    if (affectedRows === 0) {
      // Revert column type if it was converted and no rows were affected
      if (wasConverted) {
        await this.changeColumnType(table, column, originalColumnType)
      }
      return 0
    }

    // Build and execute the parameterized UPDATE query
    const { query, params } = operation()
    await this.db.run(query, params)

    return affectedRows
  }

  /**
   * Changes the column type using ALTER TABLE
   */
  protected async changeColumnType(table: string, column: string, newType: string): Promise<void> {
    await this.db.run(`ALTER TABLE "${table}" ALTER "${column}" TYPE ${newType}`)
  }

  /**
   * Escapes special regex characters in a string
   */
  protected escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  protected async getCount(query: string, params: DuckDBValue[]): Promise<number> {
    const result = (await this.db.runAndReadAll(query, params)).getRowObjectsJson() as Array<{
      count: number
    }>

    return Number(result[0]!.count)
  }

  /**
   * Checks if a column type is string-like (VARCHAR, TEXT, CHAR, BPCHAR)
   */
  private isStringLikeType(columnType: string): boolean {
    return ['VARCHAR', 'TEXT', 'CHAR', 'BPCHAR'].some((type) => columnType.includes(type))
  }

  /**
   * Ensures the column is a string-like type, converting it if necessary
   * Returns true if the column was converted, false otherwise
   */
  private async ensureColumnIsStringType(table: string, column: string): Promise<boolean> {
    const columnType = await this.getColumnType(table, column)

    if (!this.isStringLikeType(columnType)) {
      // Convert the column to VARCHAR
      await this.changeColumnType(table, column, 'VARCHAR')
      return true
    }

    return false
  }

  /**
   * Gets the column type from the table schema
   */
  private async getColumnType(table: string, column: string): Promise<string> {
    const result = await this.db.runAndReadAll(`PRAGMA table_info("${table}")`)
    const columns = result.getRowObjectsJson() as Array<{
      name: string
      type: string
    }>

    const columnInfo = columns.find((col) => col.name === column)
    if (!columnInfo) {
      throw new Error(`Column '${column}' not found in table '${table}'`)
    }

    return columnInfo.type.toUpperCase()
  }
}
