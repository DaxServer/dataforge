import { closeDb, getDb, initializeDb } from '@backend/plugins/database'
import { LowercaseConversionService } from '@backend/services/lowercase-conversion.service'
import type { DuckDBConnection } from '@duckdb/node-api'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

describe('LowercaseConversionService', () => {
  let service: LowercaseConversionService
  let db: DuckDBConnection

  beforeEach(async () => {
    await initializeDb(':memory:')
    db = getDb()
    service = new LowercaseConversionService(db)
  })

  afterEach(async () => {
    await closeDb()
  })

  describe('performOperation', () => {
    test('should convert mixed case text to lowercase', async () => {
      // Create test table
      await db.run(`
        CREATE TABLE test (
          id INTEGER,
          name VARCHAR,
          email VARCHAR
        )
      `)

      // Insert test data with mixed case
      await db.run(`
        INSERT INTO test (id, name, email) VALUES
        (1, 'John Doe', 'john@example.com'),
        (2, 'Jane Smith', 'JANE@EXAMPLE.COM'),
        (3, 'bob johnson', 'Bob@Example.com'),
        (4, 'ALICE BROWN', 'alice@example.com'),
        (5, 'Charlie Green', 'charlie@EXAMPLE.com')
      `)

      // Perform lowercase conversion on name column
      expect(
        service.performOperation({
          table: 'test',
          column: 'name',
        }),
      ).resolves.toBe(4) // John Doe, Jane Smith, ALICE BROWN, Charlie Green should be affected

      // Verify the data was actually changed
      const selectResult = await db.runAndReadAll(`SELECT name FROM test ORDER BY id`)
      const rows = selectResult.getRowObjectsJson()

      expect(rows[0]!.name).toBe('john doe') // 'John Doe' -> 'john doe'
      expect(rows[1]!.name).toBe('jane smith') // 'Jane Smith' -> 'jane smith'
      expect(rows[2]!.name).toBe('bob johnson') // 'bob johnson' -> unchanged (already lowercase)
      expect(rows[3]!.name).toBe('alice brown') // 'ALICE BROWN' -> 'alice brown'
      expect(rows[4]!.name).toBe('charlie green') // 'Charlie Green' -> 'charlie green'
    })

    test('should handle empty strings', async () => {
      // Create test table
      await db.run(`
        CREATE TABLE test (
          id INTEGER,
          text_col VARCHAR
        )
      `)

      // Insert test data with empty strings
      await db.run(`
        INSERT INTO test (id, text_col) VALUES
        (1, ''),
        (2, 'SOME TEXT'),
        (3, ''),
        (4, 'another text')
      `)

      // Perform lowercase conversion
      expect(
        service.performOperation({
          table: 'test',
          column: 'text_col',
        }),
      ).resolves.toBe(1) // Only 'SOME TEXT' should be affected (another text is already lowercase)

      // Verify the data
      const selectResult = await db.runAndReadAll(`SELECT text_col FROM test ORDER BY id`)
      const rows = selectResult.getRowObjectsJson()

      expect(rows[0]!.text_col).toBe('') // Empty string remains empty
      expect(rows[1]!.text_col).toBe('some text') // 'SOME TEXT' -> 'some text'
      expect(rows[2]!.text_col).toBe('') // Empty string remains empty
      expect(rows[3]!.text_col).toBe('another text') // 'another text' -> unchanged (already lowercase)
    })

    test('should handle NULL values', async () => {
      // Create test table
      await db.run(`
        CREATE TABLE test (
          id INTEGER,
          text_col VARCHAR
        )
      `)

      // Insert test data with NULL values
      await db.run(`
        INSERT INTO test (id, text_col) VALUES
        (1, NULL),
        (2, 'SOME TEXT'),
        (3, NULL),
        (4, 'another text')
      `)

      // Perform lowercase conversion
      const affectedRows = await service.performOperation({
        table: 'test',
        column: 'text_col',
      })

      expect(affectedRows).toBe(1) // Only 'SOME TEXT' should be affected (another text is already lowercase)

      // Verify the data
      const selectResult = await db.runAndReadAll(`SELECT text_col FROM test ORDER BY id`)
      const rows = selectResult.getRowObjectsJson()

      expect(rows[0]!.text_col).toBeNull() // NULL remains NULL
      expect(rows[1]!.text_col).toBe('some text') // 'SOME TEXT' -> 'some text'
      expect(rows[2]!.text_col).toBeNull() // NULL remains NULL
      expect(rows[3]!.text_col).toBe('another text') // 'another text' -> unchanged (already lowercase)
    })

    test('should handle non-existent column', async () => {
      // Create test table first
      await db.run(`
        CREATE TABLE test (
          id INTEGER,
          name VARCHAR
        )
      `)

      expect(
        service.performOperation({ table: 'test', column: 'nonexistent_col' }),
      ).rejects.toThrowError(`Column 'nonexistent_col' not found in table 'test'`)
    })

    test('should handle non-existent table', () => {
      expect(
        service.performOperation({ table: 'nonexistent_table', column: 'text_col' }),
      ).rejects.toThrow()
    })

    test('should return 0 when no rows need conversion', async () => {
      // Create test table
      await db.run(`
        CREATE TABLE test (
          id INTEGER,
          text_col VARCHAR
        )
      `)

      // Insert test data that's already lowercase
      await db.run(`
        INSERT INTO test (id, text_col) VALUES
        (1, 'lowercase text'),
        (2, 'all lowercase'),
        (3, 'another lowercase'),
        (4, NULL),
        (5, '')
      `)

      // Perform lowercase conversion
      expect(
        service.performOperation({
          table: 'test',
          column: 'text_col',
        }),
      ).resolves.toBe(0) // No rows should be affected as all text is already lowercase
    })

    test('should handle special characters and numbers', async () => {
      // Create test table
      await db.run(`
        CREATE TABLE test (
          id INTEGER,
          text_col VARCHAR
        )
      `)

      // Insert test data with special characters and numbers
      await db.run(`
        INSERT INTO test (id, text_col) VALUES
        (1, 'Hello World!'),
        (2, 'TEST@EMAIL.COM'),
        (3, 'USER123NAME'),
        (4, 'CamelCaseText'),
        (5, 'SNAKE_CASE_TEXT'),
        (6, 'KEBAB-CASE-TEXT'),
        (7, 'MIXED123Case456Text')
      `)

      // Perform lowercase conversion
      expect(
        service.performOperation({
          table: 'test',
          column: 'text_col',
        }),
      ).resolves.toBe(7) // All rows should be affected

      // Verify the data was converted correctly
      const selectResult = await db.runAndReadAll(`SELECT text_col FROM test ORDER BY id`)
      const rows = selectResult.getRowObjectsJson()

      expect(rows[0]!.text_col).toBe('hello world!') // 'Hello World!' -> 'hello world!'
      expect(rows[1]!.text_col).toBe('test@email.com') // 'TEST@EMAIL.COM' -> 'test@email.com'
      expect(rows[2]!.text_col).toBe('user123name') // 'USER123NAME' -> 'user123name'
      expect(rows[3]!.text_col).toBe('camelcasetext') // 'CamelCaseText' -> 'camelcasetext'
      expect(rows[4]!.text_col).toBe('snake_case_text') // 'SNAKE_CASE_TEXT' -> 'snake_case_text'
      expect(rows[5]!.text_col).toBe('kebab-case-text') // 'KEBAB-CASE-TEXT' -> 'kebab-case-text'
      expect(rows[6]!.text_col).toBe('mixed123case456text') // 'MIXED123Case456Text' -> 'mixed123case456text'
    })

    test('should handle unicode characters', async () => {
      // Create test table
      await db.run(`
        CREATE TABLE test (
          id INTEGER,
          text_col VARCHAR
        )
      `)

      // Insert test data with unicode characters
      await db.run(`
        INSERT INTO test (id, text_col) VALUES
        (1, 'CAFÉ'),
        (2, 'NAÏVE'),
        (3, 'RÉSUMÉ'),
        (4, 'ÜBER'),
        (5, 'SEÑOR')
      `)

      // Perform lowercase conversion
      expect(
        service.performOperation({
          table: 'test',
          column: 'text_col',
        }),
      ).resolves.toBe(5) // All rows should be affected

      // Verify the data was converted correctly
      const selectResult = await db.runAndReadAll(`SELECT text_col FROM test ORDER BY id`)
      const rows = selectResult.getRowObjectsJson()

      expect(rows[0]!.text_col).toBe('café') // 'CAFÉ' -> 'café'
      expect(rows[1]!.text_col).toBe('naïve') // 'NAÏVE' -> 'naïve'
      expect(rows[2]!.text_col).toBe('résumé') // 'RÉSUMÉ' -> 'résumé'
      expect(rows[3]!.text_col).toBe('über') // 'ÜBER' -> 'über'
      expect(rows[4]!.text_col).toBe('señor') // 'SEÑOR' -> 'señor'
    })
  })
})
