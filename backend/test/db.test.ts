import { describe, test, expect, afterEach } from 'bun:test'
import { closeDb, getDb, initializeDb } from '@backend/plugins/database'

describe('Database', () => {
  // Clean up the database after each test
  afterEach(async () => {
    await closeDb()
  })

  test('getDb should return a database connection', async () => {
    // Initialize the database first with in-memory database
    await initializeDb(':memory:')

    // Get the database connection
    const db = getDb()

    // Verify the connection exists and has the expected methods
    expect(db).toBeDefined()
    expect(typeof db.run).toBe('function')
    expect(typeof db.runAndReadAll).toBe('function')
  })

  test('getDb should throw if database is not initialized', () => {
    // Expect an error when getting db without initialization
    expect(() => getDb()).toThrow('Database not initialized. Call initializeDb() first.')
  })

  describe('closeDb', () => {
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

      // Second close should not throw and should resolve to undefined
      expect(closeDb()).resolves.toBeUndefined()
    })

    test('should allow re-initialization after closing', async () => {
      // Initialize, close, then re-initialize
      await initializeDb(':memory:')
      await closeDb()

      // Should be able to initialize again
      expect(initializeDb(':memory:')).resolves.toBeDefined()

      // Clean up
      await closeDb()
    })
  })
})
