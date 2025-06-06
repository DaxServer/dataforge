import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { getAllProjects } from '../../../src/api/project'
import { initializeDb, closeDb, getDb } from '../../../src/db'

describe('Project Handlers', () => {
  // Clean up the database after each test
  afterEach(async () => {
    await closeDb()
  })

  describe('getAllProjects', () => {
    test('should return empty array when no projects exist', async () => {
      // Initialize in-memory database
      await initializeDb(':memory:')

      // Call the handler
      const result = await getAllProjects()

      // Verify the response
      expect(result).toEqual({
        data: [],
      })
    })

    test('should return all projects when they exist', async () => {
      // Initialize in-memory database and get connection
      await initializeDb(':memory:')
      const db = getDb()

      // Insert test data
      const testProject = {
        name: 'Test Project',
        description: 'A test project',
        config: { key: 'value' },
      }

      await db.run(
        `INSERT INTO _meta_projects (name, description, config) 
         VALUES (?, ?, ?)`,
        [testProject.name, testProject.description, JSON.stringify(testProject.config)]
      )

      // Call the handler
      const result = await getAllProjects()

      // Verify the response structure and values
      expect(result.data).toHaveLength(1)

      const project = result.data[0]
      expect(project.name).toBe(testProject.name)
      expect(project.description).toBe(testProject.description)

      // Parse the config string back to an object for comparison
      const config = JSON.parse(project.config as string)
      expect(config).toEqual(testProject.config)

      // Verify the response has the expected fields with correct types
      expect(project).toHaveProperty('id')
      expect(project).toHaveProperty('created_at')
      expect(project).toHaveProperty('updated_at')
      expect(typeof project.id).toBe('string')
      expect(typeof project.created_at).toBe('string')
      expect(typeof project.updated_at).toBe('string')
    })
  })
})
