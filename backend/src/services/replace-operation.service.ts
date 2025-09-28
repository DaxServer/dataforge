import type { DuckDBConnection, DuckDBValue } from '@duckdb/node-api'

export interface ReplaceOperationParams {
  table: string
  column: string
  find: string
  replace: string
  caseSensitive: boolean
  wholeWord: boolean
}

export class ReplaceOperationService {
  constructor(private db: DuckDBConnection) {}

  /**
   * Performs a replace operation on a column in a project table
   */
  async performReplace(params: ReplaceOperationParams): Promise<number> {
    const { table, column, find, replace, caseSensitive, wholeWord } = params

    // Count rows that will be affected before the update
    const affectedRows = await this.countAffectedRows(table, column, find, caseSensitive, wholeWord)

    // Only proceed if there are rows to update
    if (affectedRows === 0) {
      return 0
    }

    // Build and execute the parameterized UPDATE query
    const { query, params: queryParams } = this.buildParameterizedUpdateQuery(
      table,
      column,
      find,
      replace,
      caseSensitive,
      wholeWord,
    )

    await this.db.run(query, queryParams)

    return affectedRows
  }

  /**
   * Builds a parameterized UPDATE query to safely perform replace operations
   */
  private buildParameterizedUpdateQuery(
    table: string,
    column: string,
    find: string,
    replace: string,
    caseSensitive: boolean,
    wholeWord: boolean,
  ) {
    const params: DuckDBValue[] = []

    if (wholeWord) {
      // For whole word replacement, use regex with word boundaries
      const replaceFlags = caseSensitive ? 'g' : 'gi'
      const matchFlags = caseSensitive ? '' : 'i'
      const pattern = `\\b${this.escapeRegex(find)}\\b`
      params.push(pattern, replace, replaceFlags)

      const query = `
        UPDATE "${table}"
        SET "${column}" = regexp_replace("${column}", $1, $2, $3)
        WHERE "${column}" IS NOT NULL
          AND regexp_matches("${column}", $1, '${matchFlags}')
      `

      return { query, params }
    }

    // For partial replacement, use simple replace or regex
    if (caseSensitive) {
      params.push(find, replace)

      const query = `
        UPDATE "${table}"
        SET "${column}" = replace("${column}", $1, $2)
        WHERE "${column}" IS NOT NULL
          AND position($1 in "${column}") > 0
      `

      return { query, params }
    }

    // Case-insensitive replacement using regex
    const replaceFlags = 'gi'
    const pattern = this.escapeRegex(find)
    params.push(pattern, replace, replaceFlags)

    const query = `
      UPDATE "${table}"
      SET "${column}" = regexp_replace("${column}", $1, $2, $3)
      WHERE "${column}" IS NOT NULL
        AND regexp_matches("${column}", $1, 'i')
    `

    return { query, params }
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
    let query: string
    const params: DuckDBValue[] = []

    if (wholeWord) {
      // For whole word matching, count rows where the word appears as a whole word
      const flags = caseSensitive ? '' : 'i'
      const pattern = `\\b${this.escapeRegex(find)}\\b`
      params.push(pattern, flags)
      query = `
        SELECT COUNT(*) as count FROM "${table}"
        WHERE "${column}" IS NOT NULL
          AND regexp_matches("${column}", $1, $2)
      `
    } else {
      if (caseSensitive) {
        params.push(find)
        query = `
          SELECT COUNT(*) as count FROM "${table}"
          WHERE "${column}" IS NOT NULL
            AND position($1 in "${column}") > 0
        `
      } else {
        const pattern = this.escapeRegex(find)
        params.push(pattern)
        query = `
          SELECT COUNT(*) as count FROM "${table}"
          WHERE "${column}" IS NOT NULL
            AND regexp_matches("${column}", $1, 'i')
        `
      }
    }

    const countBeforeReader = await this.db.runAndReadAll(query, params)
    const countBeforeResult = countBeforeReader.getRowObjectsJson()

    return Number(countBeforeResult[0]?.count ?? 0)
  }

  /**
   * Escapes special regex characters in a string
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
}
