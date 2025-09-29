import type { ColumnOperationParams } from '@backend/services/column-operation.service'
import { ColumnOperationService } from '@backend/services/column-operation.service'

export class LowercaseConversionService extends ColumnOperationService {
  public async performOperation(params: ColumnOperationParams): Promise<number> {
    const { table, column } = params

    return this.executeColumnOperation(
      table,
      column,
      () => this.buildParameterizedUpdateQuery(table, column),
      () => this.countAffectedRows(table, column),
    )
  }

  /**
   * Builds a parameterized UPDATE query to safely perform lowercase conversion operations
   */
  private buildParameterizedUpdateQuery(table: string, column: string) {
    const query = `
      UPDATE "${table}"
      SET "${column}" = LOWER("${column}")
      WHERE "${column}" IS NOT NULL
        AND "${column}" != LOWER("${column}")
    `

    return { query, params: [] }
  }

  /**
   * Counts the number of rows that would be affected by the lowercase conversion operation
   */
  private countAffectedRows(table: string, column: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM "${table}"
      WHERE "${column}" IS NOT NULL
        AND "${column}" != LOWER("${column}")
    `

    return this.getCount(query, [])
  }
}
