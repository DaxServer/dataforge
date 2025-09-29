import { getDb, initializeDb, closeDb } from '@backend/plugins/database'
import { UppercaseConversionService } from '@backend/services/uppercase-conversion.service'
import type { DuckDBConnection } from '@duckdb/node-api'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

describe('UppercaseConversionService', () => {
  let service: UppercaseConversionService
  let db: DuckDBConnection

  beforeEach(async () => {
    await initializeDb(':memory:')
    db = getDb()
    service = new UppercaseConversionService(db)
  })

  afterEach(async () => {
    await closeDb()
  })

  describe('performOperation', () => {
    test('should convert mixed case text to uppercase', async () => {
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

      // Perform uppercase conversion on name column
      expect(service.performOperation({
        table: 'test',
        column: 'name',
      })).resolves.toBe(4) // John Doe, Jane Smith, bob johnson, Charlie Green should be affected

      // Verify the data was actually changed
      const selectResult = await db.runAndReadAll(
        `SELECT name FROM test ORDER BY id`,
      )
      const rows = selectResult.getRowObjectsJson()

      expect(rows[0]!.name).toBe('JOHN DOE') // 'John Doe' -> 'JOHN DOE'
      expect(rows[1]!.name).toBe('JANE SMITH') // 'Jane Smith' -> 'JANE SMITH'
      expect(rows[2]!.name).toBe('BOB JOHNSON') // 'bob johnson' -> 'BOB JOHNSON'
      expect(rows[3]!.name).toBe('ALICE BROWN') // 'ALICE BROWN' -> unchanged (already uppercase)
      expect(rows[4]!.name).toBe('CHARLIE GREEN') // 'Charlie Green' -> 'CHARLIE GREEN'
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
        (2, 'some text'),
        (3, ''),
        (4, 'ANOTHER TEXT')
      `)

      // Perform uppercase conversion
      expect(service.performOperation({
        table: 'test',
        column: 'text_col',
      })).resolves.toBe(1) // Only 'some text' should be affected (ANOTHER TEXT is already uppercase)

      // Verify the data
      const selectResult = await db.runAndReadAll(
        `SELECT text_col FROM test ORDER BY id`,
      )
      const rows = selectResult.getRowObjectsJson()

      expect(rows[0]!.text_col).toBe('') // Empty string remains empty
      expect(rows[1]!.text_col).toBe('SOME TEXT') // 'some text' -> 'SOME TEXT'
      expect(rows[2]!.text_col).toBe('') // Empty string remains empty
      expect(rows[3]!.text_col).toBe('ANOTHER TEXT') // 'ANOTHER TEXT' -> unchanged (already uppercase)
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
        (2, 'some text'),
        (3, NULL),
        (4, 'ANOTHER TEXT')
      `)

      // Perform uppercase conversion
      const affectedRows = await service.performOperation({
        table: 'test',
        column: 'text_col',
      })

      expect(affectedRows).toBe(1) // Only 'some text' should be affected (ANOTHER TEXT is already uppercase)

      // Verify the data
      const selectResult = await db.runAndReadAll(
        `SELECT text_col FROM test ORDER BY id`,
      )
      const rows = selectResult.getRowObjectsJson()

      expect(rows[0]!.text_col).toBeNull() // NULL remains NULL
      expect(rows[1]!.text_col).toBe('SOME TEXT') // 'some text' -> 'SOME TEXT'
      expect(rows[2]!.text_col).toBeNull() // NULL remains NULL
      expect(rows[3]!.text_col).toBe('ANOTHER TEXT') // 'ANOTHER TEXT' -> unchanged (already uppercase)
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

      // Insert test data that's already uppercase
      await db.run(`
        INSERT INTO test (id, text_col) VALUES
        (1, 'UPPERCASE TEXT'),
        (2, 'ALL CAPS'),
        (3, 'ANOTHER UPPERCASE'),
        (4, NULL),
        (5, '')
      `)

      // Perform uppercase conversion
      expect(service.performOperation({
        table: 'test',
        column: 'text_col',
      })).resolves.toBe(0) // No rows should be affected as all text is already uppercase
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
        (2, 'test@email.com'),
        (3, 'user123name'),
        (4, 'CamelCaseText'),
        (5, 'snake_case_text'),
        (6, 'kebab-case-text'),
        (7, 'mixed123Case456Text')
      `)

      // Perform uppercase conversion
      expect(service.performOperation({
        table: 'test',
        column: 'text_col',
      })).resolves.toBe(7) // All rows should be affected

      // Verify the data was converted correctly
      const selectResult = await db.runAndReadAll(
        `SELECT text_col FROM test ORDER BY id`,
      )
      const rows = selectResult.getRowObjectsJson()

      expect(rows[0]!.text_col).toBe('HELLO WORLD!') // 'Hello World!' -> 'HELLO WORLD!'
      expect(rows[1]!.text_col).toBe('TEST@EMAIL.COM') // 'test@email.com' -> 'TEST@EMAIL.COM'
      expect(rows[2]!.text_col).toBe('USER123NAME') // 'user123name' -> 'USER123NAME'
      expect(rows[3]!.text_col).toBe('CAMELCASETEXT') // 'CamelCaseText' -> 'CAMELCASETEXT'
      expect(rows[4]!.text_col).toBe('SNAKE_CASE_TEXT') // 'snake_case_text' -> 'SNAKE_CASE_TEXT'
      expect(rows[5]!.text_col).toBe('KEBAB-CASE-TEXT') // 'kebab-case-text' -> 'KEBAB-CASE-TEXT'
      expect(rows[6]!.text_col).toBe('MIXED123CASE456TEXT') // 'mixed123Case456Text' -> 'MIXED123CASE456TEXT'
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
        (1, 'café'),
        (2, 'naïve'),
        (3, 'résumé'),
        (4, 'über'),
        (5, 'señor')
      `)

      // Perform uppercase conversion
      expect(service.performOperation({
        table: 'test',
        column: 'text_col',
      })).resolves.toBe(5) // All rows should be affected

      // Verify the data was converted correctly
      const selectResult = await db.runAndReadAll(
        `SELECT text_col FROM test ORDER BY id`,
      )
      const rows = selectResult.getRowObjectsJson()

      expect(rows[0]!.text_col).toBe('CAFÉ') // 'café' -> 'CAFÉ'
      expect(rows[1]!.text_col).toBe('NAÏVE') // 'naïve' -> 'NAÏVE'
      expect(rows[2]!.text_col).toBe('RÉSUMÉ') // 'résumé' -> 'RÉSUMÉ'
      expect(rows[3]!.text_col).toBe('ÜBER') // 'über' -> 'ÜBER'
      expect(rows[4]!.text_col).toBe('SEÑOR') // 'señor' -> 'SEÑOR'
    })
  })
})
