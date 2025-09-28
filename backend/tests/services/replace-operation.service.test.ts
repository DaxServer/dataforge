import { closeDb, getDb, initializeDb } from '@backend/plugins/database'
import { ReplaceOperationService } from '@backend/services/replace-operation.service'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

interface TestData {
  name: string
  email: string
  city: string
}

const TEST_DATA: TestData[] = [
  { name: 'John Doe', email: 'john@example.com', city: 'New York' },
  { name: 'Jane Smith', email: 'jane@example.com', city: 'Los Angeles' },
  { name: 'Bob Johnson', email: 'bob@example.com', city: 'New York' },
  { name: 'Alice Brown', email: 'alice@test.com', city: 'Chicago' },
  { name: 'Charlie Davis', email: 'charlie@example.com', city: 'New York' },
]

describe('ReplaceOperationService', () => {
  let service: ReplaceOperationService
  let table: string

  beforeEach(async () => {
    await initializeDb(':memory:')
    const db = getDb()
    service = new ReplaceOperationService(db)

    // Create a test table name
    table = 'project_test_replace'

    // Create the project table and insert test data
    await db.run(`
      CREATE TABLE "${table}" (
        name VARCHAR,
        email VARCHAR,
        city VARCHAR
      )
    `)

    // Insert test data
    for (const row of TEST_DATA) {
      await db.run(
        `
        INSERT INTO "${table}" (name, email, city)
        VALUES (?, ?, ?)
      `,
        [row.name, row.email, row.city],
      )
    }
  })

  afterEach(async () => {
    await closeDb()
  })

  describe('performReplace', () => {
    test('should perform basic replace operation', async () => {
      const result = await service.performReplace({
        table,
        column: 'city',
        find: 'New York',
        replace: 'NYC',
        caseSensitive: false,
        wholeWord: false,
      })

      expect(result.message).toBe("Successfully replaced 'New York' with 'NYC' in column 'city'")
      expect(result.affectedRows).toBe(3)
    })

    test('should perform case-sensitive replace operation', async () => {
      const result = await service.performReplace({
        table,
        column: 'name',
        find: 'John',
        replace: 'Jonathan',
        caseSensitive: true,
        wholeWord: false,
      })

      expect(result.message).toBe("Successfully replaced 'John' with 'Jonathan' in column 'name'")
      expect(result.affectedRows).toBe(2) // John Doe and John Johnson
    })

    test('should perform case-insensitive replace operation', async () => {
      const result = await service.performReplace({
        table,
        column: 'email',
        find: 'JOHN',
        replace: 'JONATHAN',
        caseSensitive: false,
        wholeWord: false,
      })

      expect(result.message).toBe("Successfully replaced 'JOHN' with 'JONATHAN' in column 'email'")
      expect(result.affectedRows).toBe(1) // john@example.com
    })

    test('should perform whole word replace operation', async () => {
      const result = await service.performReplace({
        table,
        column: 'name',
        find: 'John',
        replace: 'Jonathan',
        caseSensitive: false,
        wholeWord: true,
      })

      expect(result.message).toBe("Successfully replaced 'John' with 'Jonathan' in column 'name'")
      expect(result.affectedRows).toBe(1) // Only "John Doe" should match (whole word "John")
    })

    test('should handle replace with empty string', async () => {
      const result = await service.performReplace({
        table,
        column: 'city',
        find: 'New York',
        replace: '',
        caseSensitive: false,
        wholeWord: false,
      })

      expect(result.message).toBe("Successfully replaced 'New York' with '' in column 'city'")
      expect(result.affectedRows).toBe(3)
    })

    test('should handle special characters in find and replace', async () => {
      // Add a row with special characters
      const db = getDb()
      await db.run(
        `INSERT INTO "${table}" (name, email, city) VALUES ('Test@User', 'test@user.com', 'City')`,
      )

      const result = await service.performReplace({
        table,
        column: 'email',
        find: '@',
        replace: '[AT]',
        caseSensitive: false,
        wholeWord: false,
      })

      expect(result.message).toBe("Successfully replaced '@' with '[AT]' in column 'email'")
      expect(result.affectedRows).toBe(6) // All 6 emails contain @
    })

    test('should handle single quotes in find and replace', async () => {
      // Add a row with single quotes
      const db = getDb()
      await db.run(
        `INSERT INTO "${table}" (name, email, city) VALUES ('John''s Cafe', 'johnscafe@example.com', 'Boston')`,
      )

      const result = await service.performReplace({
        table,
        column: 'name',
        find: "John's",
        replace: "Jonathan's",
        caseSensitive: false,
        wholeWord: false,
      })

      expect(result.message).toBe(
        "Successfully replaced 'John\'s' with 'Jonathan\'s' in column 'name'",
      )
      expect(result.affectedRows).toBe(1)
    })
  })

  describe('edge cases and error handling', () => {
    test('should throw error for non-existent column', async () => {
      expect(
        service.performReplace({
          table,
          column: 'nonexistent_column',
          find: 'test',
          replace: 'replacement',
          caseSensitive: false,
          wholeWord: false,
        }),
      ).rejects.toThrow()
    })

    test('should handle non-existent project table', async () => {
      expect(
        service.performReplace({
          table: 'nonexistent_table',
          column: 'name',
          find: 'John',
          replace: 'Jonathan',
          caseSensitive: false,
          wholeWord: false,
        }),
      ).rejects.toThrow()
    })

    test('should handle no matching rows', async () => {
      const result = await service.performReplace({
        table,
        column: 'city',
        find: 'NonExistentCity',
        replace: 'NewCity',
        caseSensitive: false,
        wholeWord: false,
      })

      expect(result.message).toBe(
        "Successfully replaced 'NonExistentCity' with 'NewCity' in column 'city'",
      )
      expect(result.affectedRows).toBe(0)
    })
  })
})
