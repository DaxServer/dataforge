import { closeDb, getDb, initializeDb } from '@backend/plugins/database'
import { ReplaceOperationService } from '@backend/services/replace-operation.service'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

describe('non-string column datatype conversion', () => {
  beforeEach(async () => {
    await initializeDb(':memory:')
  })

  afterEach(async () => {
    await closeDb()
  })

  const testCases = [
    {
      name: 'INTEGER',
      tableSql: `
        CREATE TABLE test (
          id INTEGER,
          age INTEGER,
          name VARCHAR
        )
      `,
      insertSql: [
        `INSERT INTO test (id, age, name) VALUES (1, 25, 'John')`,
        `INSERT INTO test (id, age, name) VALUES (2, 30, 'Jane')`,
        `INSERT INTO test (id, age, name) VALUES (3, 25, 'Bob')`,
      ],
      columnName: 'age',
      initialType: 'INTEGER',
      find: '25',
      replace: '35',
      expectedAffectedRows: 2,
      expectedResults: ['35', '30', '35'],
    },
    {
      name: 'DOUBLE',
      tableSql: `
        CREATE TABLE test (
          id INTEGER,
          price DOUBLE,
          product VARCHAR
        )
      `,
      insertSql: [
        `INSERT INTO test (id, price, product) VALUES (1, 19.99, 'Apple')`,
        `INSERT INTO test (id, price, product) VALUES (2, 25.50, 'Banana')`,
        `INSERT INTO test (id, price, product) VALUES (3, 19.99, 'Cherry')`,
      ],
      columnName: 'price',
      initialType: 'DOUBLE',
      find: '19.99',
      replace: '29.99',
      expectedAffectedRows: 2,
      expectedResults: ['29.99', '25.5', '29.99'],
    },
    {
      name: 'BOOLEAN',
      tableSql: `
        CREATE TABLE test (
          id INTEGER,
          is_active BOOLEAN,
          username VARCHAR
        )
      `,
      insertSql: [
        `INSERT INTO test (id, is_active, username) VALUES (1, true, 'user1')`,
        `INSERT INTO test (id, is_active, username) VALUES (2, false, 'user2')`,
        `INSERT INTO test (id, is_active, username) VALUES (3, true, 'user3')`,
      ],
      columnName: 'is_active',
      initialType: 'BOOLEAN',
      find: 'true',
      replace: 'active',
      expectedAffectedRows: 2,
      expectedResults: ['active', 'false', 'active'],
    },
    {
      name: 'DATE',
      tableSql: `
        CREATE TABLE test (
          id INTEGER,
          created_date DATE,
          status VARCHAR
        )
      `,
      insertSql: [
        `INSERT INTO test (id, created_date, status) VALUES (1, '2023-01-15', 'active')`,
        `INSERT INTO test (id, created_date, status) VALUES (2, '2023-02-20', 'inactive')`,
        `INSERT INTO test (id, created_date, status) VALUES (3, '2023-01-15', 'pending')`,
      ],
      columnName: 'created_date',
      initialType: 'DATE',
      find: '2023-01-15',
      replace: '2023-03-01',
      expectedAffectedRows: 2,
      expectedResults: ['2023-03-01', '2023-02-20', '2023-03-01'],
    },
    {
      name: 'VARCHAR',
      tableSql: `
        CREATE TABLE test (
          id INTEGER,
          description VARCHAR(255),
          category VARCHAR
        )
      `,
      insertSql: [
        `INSERT INTO test (id, description, category) VALUES (1, 'test item', 'A')`,
        `INSERT INTO test (id, description, category) VALUES (2, 'another test', 'B')`,
      ],
      columnName: 'description',
      initialType: 'VARCHAR',
      find: 'test',
      replace: 'sample',
      expectedAffectedRows: 2,
      expectedResults: ['sample item', 'another sample'],
    },
    {
      name: 'JSON',
      tableSql: `
        CREATE TABLE test (
          id INTEGER,
          metadata JSON,
          name VARCHAR
        )
      `,
      insertSql: [
        `INSERT INTO test (id, metadata, name) VALUES (1, '{"status": "active", "priority": "high"}', 'Item1')`,
        `INSERT INTO test (id, metadata, name) VALUES (2, '{"status": "inactive", "priority": "low"}', 'Item2')`,
        `INSERT INTO test (id, metadata, name) VALUES (3, '{"status": "active", "priority": "medium"}', 'Item3')`,
      ],
      columnName: 'metadata',
      initialType: 'JSON',
      find: '"active"',
      replace: '"pending"',
      expectedAffectedRows: 2,
      expectedResults: [
        '{"status": "pending", "priority": "high"}',
        '{"status": "inactive", "priority": "low"}',
        '{"status": "pending", "priority": "medium"}',
      ],
    },
    {
      name: 'JSON',
      tableSql: `
        CREATE TABLE test (
          id INTEGER,
          metadata JSON,
          name VARCHAR
        )
      `,
      insertSql: [
        `INSERT INTO test (id, metadata, name) VALUES (1, '{"status": "active", "priority": "high"}', 'Item1')`,
        `INSERT INTO test (id, metadata, name) VALUES (2, '{"status": "inactive", "priority": "low"}', 'Item2')`,
        `INSERT INTO test (id, metadata, name) VALUES (3, '{"status": "active", "priority": "medium"}', 'Item3')`,
      ],
      columnName: 'metadata',
      initialType: 'JSON',
      find: 'active',
      replace: 'pending',
      expectedAffectedRows: 3,
      expectedResults: [
        '{"status": "pending", "priority": "high"}',
        '{"status": "inpending", "priority": "low"}',
        '{"status": "pending", "priority": "medium"}',
      ],
    },
    // Test cases for zero affected rows - column type should be reverted
    {
      name: 'INTEGER with zero affected rows',
      tableSql: `
        CREATE TABLE test (
          id INTEGER,
          age INTEGER,
          name VARCHAR
        )
      `,
      insertSql: [
        `INSERT INTO test (id, age, name) VALUES (1, 25, 'John')`,
        `INSERT INTO test (id, age, name) VALUES (2, 30, 'Jane')`,
        `INSERT INTO test (id, age, name) VALUES (3, 35, 'Bob')`,
      ],
      columnName: 'age',
      initialType: 'INTEGER',
      find: '99', // This value doesn't exist in the data
      replace: '100',
      expectedAffectedRows: 0,
      expectedResults: [25, 30, 35], // Data should remain unchanged
      expectTypeReverted: true, // Special flag to indicate type should be reverted
    },
    {
      name: 'DOUBLE with zero affected rows',
      tableSql: `
        CREATE TABLE test (
          id INTEGER,
          price DOUBLE,
          product VARCHAR
        )
      `,
      insertSql: [
        `INSERT INTO test (id, price, product) VALUES (1, 19.99, 'Apple')`,
        `INSERT INTO test (id, price, product) VALUES (2, 25.50, 'Banana')`,
        `INSERT INTO test (id, price, product) VALUES (3, 35.00, 'Cherry')`,
      ],
      columnName: 'price',
      initialType: 'DOUBLE',
      find: '99.99', // This value doesn't exist in the data
      replace: '100.00',
      expectedAffectedRows: 0,
      expectedResults: [19.99, 25.5, 35.0], // Data should remain unchanged
      expectTypeReverted: true, // Special flag to indicate type should be reverted
    },
    {
      name: 'BOOLEAN with zero affected rows',
      tableSql: `
        CREATE TABLE test (
          id INTEGER,
          is_active BOOLEAN,
          username VARCHAR
        )
      `,
      insertSql: [
        `INSERT INTO test (id, is_active, username) VALUES (1, true, 'user1')`,
        `INSERT INTO test (id, is_active, username) VALUES (2, false, 'user2')`,
        `INSERT INTO test (id, is_active, username) VALUES (3, true, 'user3')`,
      ],
      columnName: 'is_active',
      initialType: 'BOOLEAN',
      find: 'maybe', // This value doesn't exist in boolean data
      replace: 'possibly',
      expectedAffectedRows: 0,
      expectedResults: [true, false, true], // Data should remain unchanged
      expectTypeReverted: true, // Special flag to indicate type should be reverted
    },
  ]

  test.each(testCases)(
    'should $name column and perform replace',
    async ({
      tableSql,
      insertSql,
      columnName,
      initialType,
      find,
      replace,
      expectedAffectedRows,
      expectedResults,
      expectTypeReverted,
    }) => {
      const db = getDb()
      const service = new ReplaceOperationService(db)

      await db.run(tableSql)

      // Insert test data
      for (const sql of insertSql) {
        await db.run(sql)
      }

      // Verify initial column type
      const initialTypeResult = (
        await db.runAndReadAll(`PRAGMA table_info("test")`)
      ).getRowObjectsJson() as Array<{
        name: string
        type: string
      }>
      const column = initialTypeResult.find((col) => col.name === columnName)
      expect(column).toBeDefined()
      expect(column!.type).toBe(initialType)

      // Perform replace operation
      const affectedRows = await service.performOperation({
        table: 'test',
        column: columnName,
        find,
        replace,
        caseSensitive: false,
        wholeWord: false,
      })

      expect(affectedRows).toBe(expectedAffectedRows)

      // Verify column type after operation
      const finalType = (
        await db.runAndReadAll(`PRAGMA table_info("test")`)
      ).getRowObjectsJson() as Array<{
        name: string
        type: string
      }>
      const columnAfter = finalType.find((col) => col.name === columnName)
      expect(columnAfter).toBeDefined()

      // For zero affected rows with non-string types, expect type to be reverted
      if (expectTypeReverted) {
        expect(columnAfter!.type).toBe(initialType)
      } else {
        expect(columnAfter!.type).toBe('VARCHAR')
      }

      // Verify data was replaced correctly (or unchanged for zero affected rows)
      const result = await db.runAndReadAll(`SELECT ${columnName} FROM "test" ORDER BY id`)
      const values = result.getRowObjectsJson().map((row) => row[columnName])
      expect(values).toEqual(expectedResults)
    },
  )
})
