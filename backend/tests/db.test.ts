import { describe, test, expect, afterEach, beforeEach } from 'bun:test'
import { closeDb, getDb, initializeDb } from '@backend/plugins/database'

describe('Database', () => {
  // Clean up the database after each test
  afterEach(async () => {
    await closeDb()
  })

  test('should initialize database successfully', async () => {
    const db = await initializeDb(':memory:')
    expect(db).toBeDefined()
    expect(typeof db.run).toBe('function')
  })

  test('getDb should return a database connection', async () => {
    // Initialize the database first with in-memory database
    await initializeDb(':memory:')

    // Get the database connection
    const db = getDb()

    // Verify the connection exists and has the expected methods
    expect(db).toBeDefined()
    expect(typeof db.run).toBe('function')
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
      await expect(closeDb()).resolves.toBeUndefined()
    })

    test('should allow re-initialization after closing', async () => {
      // Initialize, close, then re-initialize
      await initializeDb(':memory:')
      await closeDb()

      // Should be able to initialize again
      const db = await initializeDb(':memory:')
      expect(db).toBeDefined()
      expect(typeof db.run).toBe('function')
    })
  })
})
