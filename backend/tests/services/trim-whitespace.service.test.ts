import { getDb, initializeDb } from '@backend/plugins/database'
import { TrimWhitespaceService } from '@backend/services/trim-whitespace.service'
import { beforeEach, describe, expect, test } from 'bun:test'

describe('TrimWhitespaceService', () => {
  let service: TrimWhitespaceService

  beforeEach(async () => {
    await initializeDb(':memory:')
    const db = getDb()
    service = new TrimWhitespaceService(db)

    // Create test table
    await db.run(`
      CREATE TABLE test (
        id INTEGER PRIMARY KEY,
        text_col VARCHAR(255),
        int_col INTEGER,
        double_col DOUBLE,
        bool_col BOOLEAN,
        date_col DATE
      )
    `)

    // Insert test data
    await db.run(`
      INSERT INTO test (id, text_col, int_col, double_col, bool_col, date_col) VALUES
      (1, '  hello world  ', 1, 1.5, true, '2023-01-01'),
      (2, '\ttab start', 2, 2.5, false, '2023-01-02'),
      (3, 'newline end\n', 3, 3.5, true, '2023-01-03'),
      (4, '  \t multiple   spaces  \n  ', 4, 4.5, false, '2023-01-04'),
      (5, 'no whitespace', 5, 5.5, true, '2023-01-05'),
      (6, '', 6, 6.5, false, '2023-01-06'),
      (7, '   ', 7, 7.5, true, '2023-01-07'),
      (8, '  \u00A0 non-breaking space  ', 8, 8.5, true, '2023-01-08'),
      (9, '\u2003\u2003em spaces', 9, 9.5, true, '2023-01-09'),
      (10, '\u200B\u200Bzero width spaces\u200B\u200B', 10, 10.5, true, '2023-01-10'),
      (11, '  mixed  \t\u00A0  spaces  ', 11, 11.5, true, '2023-01-11'),
      (12, 'normal text', 12, 12.5, true, '2023-01-12')
    `)
  })

  describe('performOperation', () => {
    test('should trim whitespace from VARCHAR column', async () => {
      await service.performOperation({ table: 'test', column: 'text_col' })

      // Verify the data was actually changed
      const db = getDb()
      const selectResult = await db.runAndReadAll(
        `SELECT text_col FROM test WHERE id < 8 ORDER BY id`,
      )
      const rows = selectResult.getRowObjectsJson()

      expect(rows[0]!.text_col).toBe('hello world') // '  hello world  ' -> 'hello world'
      expect(rows[1]!.text_col).toBe('tab start') // '\ttab start' -> 'tab start' (tab trimmed)
      expect(rows[2]!.text_col).toBe('newline end') // 'newline end\n' -> 'newline end' (newline trimmed)
      expect(rows[3]!.text_col).toBe('multiple   spaces') // '  \t multiple   spaces  \n  ' -> 'multiple   spaces'
      expect(rows[4]!.text_col).toBe('no whitespace') // unchanged
      expect(rows[5]!.text_col).toBe('') // unchanged
      expect(rows[6]!.text_col).toBe('') // '   ' -> '' (affected)
    })

    test('should handle non-existent column', () => {
      expect(
        service.performOperation({ table: 'test', column: 'nonexistent_col' }),
      ).rejects.toThrowError(`Column 'nonexistent_col' not found in table 'test'`)
    })

    test('should handle non-existent table', () => {
      expect(
        service.performOperation({ table: 'nonexistent_table', column: 'text_col' }),
      ).rejects.toThrowError(/Table.*nonexistent_table.*does not exist/)
    })

    test('should handle empty string values', async () => {
      await service.performOperation({ table: 'test', column: 'text_col' })

      const db = getDb()
      const selectResult = await db.runAndReadAll(
        'SELECT text_col FROM test WHERE id BETWEEN 6 AND 7 ORDER BY id',
      )
      const rows = selectResult.getRowObjectsJson()

      expect(rows[0]!.text_col).toBe('') // unchanged
      expect(rows[1]!.text_col).toBe('') // '   ' -> '' (affected)
    })

    test('should handle INTEGER column (0 affected rows)', () => {
      expect(service.performOperation({ table: 'test', column: 'int_col' })).resolves.toBe(0)
    })

    test('should handle DOUBLE column (0 affected rows)', () => {
      expect(service.performOperation({ table: 'test', column: 'double_col' })).resolves.toBe(0)
    })

    test('should handle BOOLEAN column (0 affected rows)', () => {
      expect(service.performOperation({ table: 'test', column: 'bool_col' })).resolves.toBe(0)
    })

    test('should handle DATE column (0 affected rows)', () => {
      expect(service.performOperation({ table: 'test', column: 'date_col' })).resolves.toBe(0)
    })

    test('should handle special characters and unicode', async () => {
      await service.performOperation({ table: 'test', column: 'text_col' })

      const db = getDb()
      const selectResult = await db.runAndReadAll(
        'SELECT text_col FROM test WHERE id BETWEEN 8 AND 11 ORDER BY id',
      )
      const rows = selectResult.getRowObjectsJson()

      expect(rows[0]!.text_col).toBe('\u00A0 non-breaking space') // '  \u00A0 non-breaking space  ' -> '\u00A0 non-breaking space'
      expect(rows[1]!.text_col).toBe('\u2003\u2003em spaces') // unchanged (leading em spaces)
      expect(rows[2]!.text_col).toBe('\u200B\u200Bzero width spaces\u200B\u200B') // unchanged (zero width spaces)
      expect(rows[3]!.text_col).toBe('mixed  \t\u00A0  spaces') // '  mixed  \t\u00A0  spaces  ' -> 'mixed  \t\u00A0  spaces'
    })
  })
})
