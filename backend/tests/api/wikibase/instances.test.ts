import { describe, test, expect, beforeEach } from 'bun:test'
import { elysiaApp } from '@backend/index'
import type { WikibaseInstanceConfig } from '@backend/types/wikibase-api'

describe('Wikibase Instances API', () => {
  let mockCustomConfig: WikibaseInstanceConfig

  beforeEach(() => {
    mockCustomConfig = {
      id: 'test-custom',
      name: 'Test Custom Instance',
      baseUrl: 'https://test.wikibase.org/w/rest.php/wikibase/v0',
      userAgent: 'DataForge/1.0.0 (test)',
      isDefault: false,
      metadata: {
        description: 'Test custom instance for API tests',
        language: 'en',
        version: '1.0.0',
      },
    }
  })

  describe('GET /wikibase/instances', () => {
    test('should return all instances', async () => {
      const response = await elysiaApp.handle(
        new Request('http://localhost:3000/wikibase/instances', {
          method: 'GET',
        }),
      )

      expect(response.status).toBe(200)

      const data = (await response.json()) as any
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.data.length).toBeGreaterThan(0)

      // Should include pre-defined instances
      expect(data.data.some((instance: any) => instance.id === 'wikidata')).toBe(true)
    })
  })

  describe('GET /wikibase/instances/:instanceId', () => {
    test('should return specific instance', async () => {
      const response = await elysiaApp.handle(
        new Request('http://localhost:3000/wikibase/instances/wikidata', {
          method: 'GET',
        }),
      )

      expect(response.status).toBe(200)

      const data = (await response.json()) as any
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('wikidata')
      expect(data.data.name).toBe('Wikidata')
    })

    test('should return error for non-existent instance', async () => {
      const response = await elysiaApp.handle(
        new Request('http://localhost:3000/wikibase/instances/non-existent', {
          method: 'GET',
        }),
      )

      expect(response.status).toBe(404)

      const data = (await response.json()) as any
      expect(data.error).toBeDefined()
      expect(data.error.code).toBeDefined()
      expect(data.error.message).toContain('not found')
    })
  })

  describe('POST /wikibase/instances', () => {
    test('should add valid custom instance', async () => {
      const response = await elysiaApp.handle(
        new Request('http://localhost:3000/wikibase/instances', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockCustomConfig),
        }),
      )

      expect(response.status).toBe(200)

      const data = (await response.json()) as any
      expect(data.success).toBe(true)
      expect(data.message).toContain('added successfully')
    })

    test('should reject invalid instance configuration', async () => {
      const invalidConfig = {
        id: '',
        name: '',
        baseUrl: 'invalid-url',
        userAgent: '',
      }

      const response = await elysiaApp.handle(
        new Request('http://localhost:3000/wikibase/instances', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(invalidConfig),
        }),
      )

      expect(response.status).toBe(400)

      const data = (await response.json()) as any
      expect(data.error).toBeDefined()
      expect(data.error.code).toBeDefined()
      expect(data.error.message).toBeDefined()
    })

    test('should reject duplicate instance ID', async () => {
      // First add the instance
      await elysiaApp.handle(
        new Request('http://localhost:3000/wikibase/instances', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockCustomConfig),
        }),
      )

      // Try to add the same instance again
      const response = await elysiaApp.handle(
        new Request('http://localhost:3000/wikibase/instances', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockCustomConfig),
        }),
      )

      expect(response.status).toBe(400)

      const data = (await response.json()) as any
      expect(data.error).toBeDefined()
      expect(data.error.code).toBeDefined()
      expect(data.error.message).toBeDefined()
    })
  })

  describe('PUT /wikibase/instances/:instanceId', () => {
    test('should update custom instance', async () => {
      // First add the instance
      await elysiaApp.handle(
        new Request('http://localhost:3000/wikibase/instances', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockCustomConfig),
        }),
      )

      // Update the instance
      const updates = { name: 'Updated Test Instance' }
      const response = await elysiaApp.handle(
        new Request('http://localhost:3000/wikibase/instances/test-custom', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        }),
      )

      expect(response.status).toBe(200)

      const data = (await response.json()) as any
      expect(data.success).toBe(true)
      expect(data.message).toContain('updated successfully')
    })

    test('should reject updating pre-defined instance', async () => {
      const updates = { name: 'Updated Wikidata' }
      const response = await elysiaApp.handle(
        new Request('http://localhost:3000/wikibase/instances/wikidata', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        }),
      )

      expect(response.status).toBe(400)

      const data = (await response.json()) as any
      expect(data.error).toBeDefined()
      expect(data.error.code).toBeDefined()
      expect(data.error.message).toBeDefined()
    })
  })

  describe('DELETE /wikibase/instances/:instanceId', () => {
    test('should remove custom instance', async () => {
      // First add the instance
      await elysiaApp.handle(
        new Request('http://localhost:3000/wikibase/instances', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockCustomConfig),
        }),
      )

      // Remove the instance
      const response = await elysiaApp.handle(
        new Request('http://localhost:3000/wikibase/instances/test-custom', {
          method: 'DELETE',
        }),
      )

      expect(response.status).toBe(200)

      const data = (await response.json()) as any
      expect(data.success).toBe(true)
      expect(data.message).toContain('removed successfully')
    })

    test('should reject removing pre-defined instance', async () => {
      const response = await elysiaApp.handle(
        new Request('http://localhost:3000/wikibase/instances/wikidata', {
          method: 'DELETE',
        }),
      )

      expect(response.status).toBe(400)

      const data = (await response.json()) as any
      expect(data.error).toBeDefined()
      expect(data.error.code).toBeDefined()
      expect(data.error.message).toBeDefined()
    })
  })

  describe('POST /wikibase/instances/validate', () => {
    test('should validate valid configuration', async () => {
      const response = await elysiaApp.handle(
        new Request('http://localhost:3000/wikibase/instances/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockCustomConfig),
        }),
      )

      expect(response.status).toBe(200)

      const data = (await response.json()) as any
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('isValid')
      expect(data.data).toHaveProperty('errors')
      expect(data.data).toHaveProperty('warnings')
    })

    test('should reject invalid configuration', async () => {
      const invalidConfig = {
        id: '',
        name: '',
        baseUrl: 'invalid-url',
        userAgent: '',
      }

      const response = await elysiaApp.handle(
        new Request('http://localhost:3000/wikibase/instances/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(invalidConfig),
        }),
      )

      expect(response.status).toBe(200)

      const data = (await response.json()) as any
      expect(data.success).toBe(true)
      expect(data.data.isValid).toBe(false)
      expect(data.data.errors.length).toBeGreaterThan(0)
    })
  })

  describe('POST /wikibase/instances/:instanceId/validate', () => {
    test('should validate existing instance', async () => {
      const response = await elysiaApp.handle(
        new Request('http://localhost:3000/wikibase/instances/wikidata/validate', {
          method: 'POST',
        }),
      )

      expect(response.status).toBe(200)

      const data = (await response.json()) as any
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('isValid')
      expect(data.data).toHaveProperty('errors')
      expect(data.data).toHaveProperty('warnings')
    })

    test('should return error for non-existent instance', async () => {
      const response = await elysiaApp.handle(
        new Request('http://localhost:3000/wikibase/instances/non-existent/validate', {
          method: 'POST',
        }),
      )

      expect(response.status).toBe(404)

      const data = (await response.json()) as any
      expect(data.error).toBeDefined()
      expect(data.error.code).toBeDefined()
      expect(data.error.message).toContain('not found')
    })
  })

  describe('GET /wikibase/instances/:instanceId/health', () => {
    test('should perform health check on existing instance', async () => {
      const response = await elysiaApp.handle(
        new Request('http://localhost:3000/wikibase/instances/wikidata/health', {
          method: 'GET',
        }),
      )

      expect(response.status).toBe(200)

      const data = (await response.json()) as any
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('instanceId')
      expect(data.data).toHaveProperty('isHealthy')
      expect(data.data).toHaveProperty('lastChecked')
      expect(data.data).toHaveProperty('responseTime')
      expect(data.data.instanceId).toBe('wikidata')
    })

    test('should return error for non-existent instance', async () => {
      const response = await elysiaApp.handle(
        new Request('http://localhost:3000/wikibase/instances/non-existent/health', {
          method: 'GET',
        }),
      )

      expect(response.status).toBe(200)

      const data = (await response.json()) as any
      expect(data.success).toBe(true)
      expect(data.data.instanceId).toBe('non-existent')
      expect(data.data.isHealthy).toBe(false)
      expect(data.data.error).toContain('Instance not found')
    })
  })

  describe('GET /wikibase/instances/default', () => {
    test('should return default instance', async () => {
      const response = await elysiaApp.handle(
        new Request('http://localhost:3000/wikibase/instances/default', {
          method: 'GET',
        }),
      )

      expect(response.status).toBe(200)

      const data = (await response.json()) as any
      expect(data.success).toBe(true)
      expect(data.data).not.toBeNull()
      expect(data.data.isDefault).toBe(true)
    })
  })

  describe('POST /wikibase/instances/:instanceId/set-default', () => {
    test('should set custom instance as default', async () => {
      // First add a custom instance
      await elysiaApp.handle(
        new Request('http://localhost:3000/wikibase/instances', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockCustomConfig),
        }),
      )

      // Set it as default
      const response = await elysiaApp.handle(
        new Request('http://localhost:3000/wikibase/instances/test-custom/set-default', {
          method: 'POST',
        }),
      )

      expect(response.status).toBe(200)

      const data = (await response.json()) as any
      expect(data.success).toBe(true)
      expect(data.message).toContain('Default instance set successfully')
    })

    test('should return error for non-existent instance', async () => {
      const response = await elysiaApp.handle(
        new Request('http://localhost:3000/wikibase/instances/non-existent/set-default', {
          method: 'POST',
        }),
      )

      expect(response.status).toBe(404)

      const data = (await response.json()) as any
      expect(data.error).toBeDefined()
      expect(data.error.code).toBeDefined()
      expect(data.error.message).toContain('not found')
    })
  })
})
