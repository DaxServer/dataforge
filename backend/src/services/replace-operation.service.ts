import type { DuckDBConnection } from '@duckdb/node-api'

export interface ReplaceOperationParams {
  table: string
  column: string
  find: string
  replace: string
  caseSensitive: boolean
  wholeWord: boolean
}

export interface ReplaceOperationResult {
  message: string
  affectedRows: number
}

export class ReplaceOperationService {
  constructor(private db: DuckDBConnection) {}

  /**
   * Performs a replace operation on a column in a project table
   */
  async performReplace(params: ReplaceOperationParams): Promise<ReplaceOperationResult> {
    const { table, column, find, replace, caseSensitive, wholeWord } = params

    // Build the REPLACE operation based on parameters
    const replaceExpression = this.buildReplaceExpression(
      column,
      find,
      replace,
      caseSensitive,
      wholeWord,
    )

    // Count rows that will be affected before the update
    const affectedRows = await this.countAffectedRows(table, column, find, caseSensitive, wholeWord)

    // Execute the update
    await this.db.run(
      `UPDATE "${table}" SET "${column}" = ${replaceExpression} WHERE "${column}" IS NOT NULL`,
    )

    return {
      message: `Successfully replaced '${find}' with '${replace}' in column '${column}'`,
      affectedRows,
    }
  }

  /**
   * Builds the appropriate replace expression based on the operation parameters
   */
  private buildReplaceExpression(
    column: string,
    find: string,
    replace: string,
    caseSensitive: boolean,
    wholeWord: boolean,
  ): string {
    if (wholeWord) {
      // For whole word replacement, use regex with word boundaries
      const flags = caseSensitive ? 'g' : 'gi'
      const pattern = `\\b${this.escapeRegex(find)}\\b`
      return `regexp_replace("${column}", '${pattern}', '${this.escapeSql(replace)}', '${flags}')`
    }

    // For partial replacement, use simple replace or regex
    if (caseSensitive) {
      return `replace("${column}", '${this.escapeSql(find)}', '${this.escapeSql(replace)}')`
    }

    // Case-insensitive replacement using regex
    const flags = 'gi'
    const pattern = this.escapeRegex(find)
    return `regexp_replace("${column}", '${pattern}', '${this.escapeSql(replace)}', '${flags}')`
  }

  /**
   * Counts the number of rows that will be affected by the replace operation
   */
  private async countAffectedRows(
    table: string,
    column: string,
    find: string,
    caseSensitive: boolean,
    wholeWord: boolean,
  ): Promise<number> {
    let countQuery: string

    if (wholeWord) {
      // For whole word matching, count rows where the word appears as a whole word
      const flags = caseSensitive ? '' : 'i'
      const pattern = `\\b${this.escapeRegex(find)}\\b`
      countQuery = `SELECT COUNT(*) as count FROM "${table}" WHERE "${column}" IS NOT NULL AND regexp_matches("${column}", '${pattern}', '${flags}')`
    } else {
      if (caseSensitive) {
        countQuery = `SELECT COUNT(*) as count FROM "${table}" WHERE "${column}" IS NOT NULL AND position('${this.escapeSql(find)}' in "${column}") > 0`
      } else {
        const pattern = this.escapeRegex(find)
        countQuery = `SELECT COUNT(*) as count FROM "${table}" WHERE "${column}" IS NOT NULL AND regexp_matches("${column}", '${pattern}', 'i')`
      }
    }

    const countBeforeReader = await this.db.runAndReadAll(countQuery)
    const countBeforeResult = countBeforeReader.getRowObjectsJson()

    return Number(countBeforeResult[0]?.count ?? 0)
  }

  /**
   * Escapes special regex characters in a string
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "''")
  }

  /**
   * Escapes single quotes for SQL
   */
  private escapeSql(str: string): string {
    return str.replace(/'/g, "''")
  }
}
