import type { ColumnOperationParams } from '@backend/services/column-operation.service'
import { ColumnOperationService } from '@backend/services/column-operation.service'

export class TrimWhitespaceService extends ColumnOperationService {
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
   * Builds a parameterized UPDATE query to safely perform trim whitespace operations
   */
  private buildParameterizedUpdateQuery(table: string, column: string) {
    const query = `
      UPDATE "${table}"
      SET "${column}" = regexp_replace("${column}", '^\\s+|\\s+$', '', 'g')
      WHERE "${column}" IS NOT NULL
        AND "${column}" != regexp_replace("${column}", '^\\s+|\\s+$', '', 'g')
    `

    return { query, params: [] }
  }

  /**
   * Counts the number of rows that would be affected by the trim operation
   */
  private countAffectedRows(table: string, column: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM "${table}"
      WHERE "${column}" IS NOT NULL
        AND "${column}" != regexp_replace("${column}", '^\\s+|\\s+$', '', 'g')
    `

    return this.getCount(query, [])
  }
}
