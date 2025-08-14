import { describe, test, expect, expectTypeOf, afterEach, beforeEach } from 'bun:test'
import { closeDb, getDb, initializeDb } from '@backend/plugins/database'

describe('Database', () => {
  // Clean up the database after each test
  afterEach(async () => {
    await closeDb()
  })

  test('should initialize database successfully', async () => {
    const db = await initializeDb(':memory:')
    expect(db).toBeDefined()
    expectTypeOf(db.run).toBeFunction()
  })

  test('getDb should return a database connection', async () => {
    // Initialize the database first with in-memory database
    await initializeDb(':memory:')

    // Get the database connection
    const db = getDb()

    // Verify the connection exists and has the expected methods
    expect(db).toBeDefined()
    expectTypeOf(db.run).toBeFunction()
  })

  test('getDb should throw if database is not initialized', () => {
    // Expect an error when getting db without initialization
    expect(() => getDb()).toThrow('Database not initialized. Call initializeDb() first.')
  })

  describe('closeDb', () => {
    beforeEach(async () => {
      await closeDb()
    })

    test('should close the database connection', async () => {
      // Initialize and get the database connection
      await initializeDb(':memory:')

      // Close the connection
      await closeDb()

      // Verify the connection is closed by checking if we can't get it again
      expect(() => getDb()).toThrow('Database not initialized. Call initializeDb() first.')
    })

    test('should be idempotent (multiple calls are safe)', async () => {
      await initializeDb(':memory:')

      // First close
      await closeDb()

      // Second close should not throw
      expect(closeDb()).resolves.toBeUndefined()
    })

    test('should allow re-initialization after closing', async () => {
      // Initialize, close, then re-initialize
      await initializeDb(':memory:')
      await closeDb()

      // Should be able to initialize again
      const db = await initializeDb(':memory:')
      expect(db).toBeDefined()
      expectTypeOf(db.run).toBeFunction()
    })
  })
})

describe('Meta Wikibase Schema Table', () => {
  const TEST_PROJECT_ID = Bun.randomUUIDv7()

  beforeEach(async () => {
    await initializeDb(':memory:')
    const db = getDb()
    await db.run(`INSERT INTO _meta_projects (id, name, schema_for, schema) VALUES (?, ?, ?, ?)`, [
      TEST_PROJECT_ID,
      'Test Project',
      null,
      '{}',
    ])
  })

  afterEach(async () => {
    await closeDb()
  })

  test('should enforce foreign key constraint on project_id', async () => {
    const db = getDb()
    // Try to insert with a non-existent project_id
    expect(
      db.run(`INSERT INTO _meta_wikibase_schema (id, project_id, wikibase) VALUES (?, ?, ?)`, [
        Bun.randomUUIDv7(),
        '22222222-2222-4222-8222-222222222222',
        'wikibase',
      ]),
    ).rejects.toThrow()
  })
})
