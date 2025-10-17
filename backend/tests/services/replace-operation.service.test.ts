import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { closeDb, getDb, initializeDb } from '@backend/plugins/database'
import { ReplaceOperationService } from '@backend/services/replace-operation.service'

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
    test('should perform basic replace operation', () => {
      expect(
        service.performOperation({
          table,
          column: 'city',
          find: 'New York',
          replace: 'NYC',
          caseSensitive: false,
          wholeWord: false,
        }),
      ).resolves.toBe(3)
    })

    test('should perform case-sensitive replace operation', () => {
      expect(
        service.performOperation({
          table,
          column: 'name',
          find: 'John',
          replace: 'Jonathan',
          caseSensitive: true,
          wholeWord: false,
        }),
      ).resolves.toBe(2) // John Doe and John Johnson
    })

    test('should perform case-insensitive replace operation', () => {
      expect(
        service.performOperation({
          table,
          column: 'email',
          find: 'JOHN',
          replace: 'JONATHAN',
          caseSensitive: false,
          wholeWord: false,
        }),
      ).resolves.toBe(1) // john@example.com
    })

    test('should perform whole word replace operation', () => {
      expect(
        service.performOperation({
          table,
          column: 'name',
          find: 'John',
          replace: 'Jonathan',
          caseSensitive: false,
          wholeWord: true,
        }),
      ).resolves.toBe(1) // Only "John Doe" should match (whole word "John")
    })

    test('should handle replace with empty string', () => {
      expect(
        service.performOperation({
          table,
          column: 'city',
          find: 'New York',
          replace: '',
          caseSensitive: false,
          wholeWord: false,
        }),
      ).resolves.toBe(3)
    })

    test('should handle special characters in find and replace', async () => {
      // Add a row with special characters
      const db = getDb()
      await db.run(
        `INSERT INTO "${table}" (name, email, city) VALUES ('Test@User', 'test@user.com', 'City')`,
      )

      expect(
        service.performOperation({
          table,
          column: 'email',
          find: '@',
          replace: '[AT]',
          caseSensitive: false,
          wholeWord: false,
        }),
      ).resolves.toBe(6) // All 6 emails contain @
    })

    test('should handle single quotes in find and replace', async () => {
      // Add a row with single quotes
      const db = getDb()
      await db.run(
        `INSERT INTO "${table}" (name, email, city) VALUES ('John''s Cafe', 'johnscafe@example.com', 'Boston')`,
      )

      expect(
        service.performOperation({
          table,
          column: 'name',
          find: "John's",
          replace: "Jonathan's",
          caseSensitive: false,
          wholeWord: false,
        }),
      ).resolves.toBe(1)
    })
  })

  describe('edge cases and error handling', () => {
    test('should throw error for non-existent column', () => {
      expect(
        service.performOperation({
          table,
          column: 'nonexistent_column',
          find: 'test',
          replace: 'replacement',
          caseSensitive: false,
          wholeWord: false,
        }),
      ).rejects.toThrow()
    })

    test('should handle non-existent project table', () => {
      expect(
        service.performOperation({
          table: 'nonexistent_table',
          column: 'name',
          find: 'John',
          replace: 'Jonathan',
          caseSensitive: false,
          wholeWord: false,
        }),
      ).rejects.toThrow()
    })

    test('should handle no matching rows', () => {
      expect(
        service.performOperation({
          table,
          column: 'city',
          find: 'NonExistentCity',
          replace: 'NewCity',
          caseSensitive: false,
          wholeWord: false,
        }),
      ).resolves.toBe(0)
    })
  })
})
