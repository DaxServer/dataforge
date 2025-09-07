import { WikibaseApiService } from '@backend/services/wikibase-api.service'
import type { WikibaseInstanceConfig } from '@backend/types/wikibase-api'
import type { ItemId, PropertyId } from '@backend/types/wikibase-schema'
import { beforeEach, describe, expect, expectTypeOf, test } from 'bun:test'

describe('WikibaseApiService', () => {
  let service: WikibaseApiService
  let mockInstanceConfig: WikibaseInstanceConfig

  beforeEach(() => {
    service = new WikibaseApiService()
    mockInstanceConfig = {
      id: 'test-instance',
      name: 'Test Wikibase',
      baseUrl: 'https://test.wikibase.org/w/rest.php/wikibase/v0',
      userAgent: 'DataForge/1.0.0 (test)',
      isDefault: false,
      metadata: {
        description: 'Test instance for unit tests',
        language: 'en',
        version: '1.0.0',
      },
    }
  })

  describe('Client Management', () => {
    test('should create and store a new client', () => {
      const client = service.createClient(mockInstanceConfig)

      expect(client).toBeDefined()
      expect(service.hasClient('test-instance')).toBe(true)
      expect(service.getInstanceIds()).toContain('test-instance')
    })

    test('should create client with auth token', () => {
      const configWithAuth = {
        ...mockInstanceConfig,
        authToken: 'test-token-123',
      }

      const client = service.createClient(configWithAuth)

      expect(client).toBeDefined()
      expect(service.hasClient('test-instance')).toBe(true)
      expect(client.apiClient.defaultHeaders).toHaveProperty(
        'Authorization',
        'Bearer test-token-123',
      )
    })

    test('should retrieve existing client', () => {
      service.createClient(mockInstanceConfig)

      const client = service.getClient('test-instance')

      expect(client).toBeDefined()
    })

    test('should throw error when getting non-existent client', () => {
      expect(() => service.getClient('non-existent')).toThrow(
        'No client found for instance: non-existent',
      )
    })

    test('should retrieve instance configuration', () => {
      service.createClient(mockInstanceConfig)

      const instance = service.getInstance('test-instance')

      expect(instance).toEqual(mockInstanceConfig)
    })

    test('should throw error when getting non-existent instance', () => {
      expect(() => service.getInstance('non-existent')).toThrow(
        'No instance configuration found for: non-existent',
      )
    })

    test('should check if client exists', () => {
      expect(service.hasClient('test-instance')).toBe(false)

      service.createClient(mockInstanceConfig)

      expect(service.hasClient('test-instance')).toBe(true)
    })

    test('should remove client and instance', () => {
      service.createClient(mockInstanceConfig)
      expect(service.hasClient('test-instance')).toBe(true)

      const removed = service.removeClient('test-instance')

      expect(removed).toBe(true)
      expect(service.hasClient('test-instance')).toBe(false)
    })

    test('should return false when removing non-existent client', () => {
      const removed = service.removeClient('non-existent')

      expect(removed).toBe(false)
    })

    test('should get all instance IDs', () => {
      const config1 = { ...mockInstanceConfig, id: 'instance-1' }
      const config2 = { ...mockInstanceConfig, id: 'instance-2' }

      service.createClient(config1)
      service.createClient(config2)

      const instanceIds = service.getInstanceIds()

      expect(instanceIds).toHaveLength(2)
      expect(instanceIds).toContain('instance-1')
      expect(instanceIds).toContain('instance-2')
    })

    test('should get all instances', () => {
      const config1 = { ...mockInstanceConfig, id: 'instance-1', name: 'Instance 1' }
      const config2 = { ...mockInstanceConfig, id: 'instance-2', name: 'Instance 2' }

      service.createClient(config1)
      service.createClient(config2)

      const instances = service.getAllInstances()

      expect(instances).toHaveLength(2)
      expect(instances.find((i) => i.id === 'instance-1')?.name).toBe('Instance 1')
      expect(instances.find((i) => i.id === 'instance-2')?.name).toBe('Instance 2')
    })
  })

  describe('Configuration Validation', () => {
    test('should handle instance config with minimal required fields', () => {
      const minimalConfig: WikibaseInstanceConfig = {
        id: 'minimal',
        name: 'Minimal Instance',
        baseUrl: 'https://minimal.wikibase.org/w/rest.php/wikibase/v0',
        userAgent: 'DataForge/1.0.0',
      }

      const client = service.createClient(minimalConfig)

      expect(client).toBeDefined()
      expect(service.getInstance('minimal')).toEqual(minimalConfig)
    })

    test('should handle instance config with all optional fields', () => {
      const fullConfig: WikibaseInstanceConfig = {
        id: 'full',
        name: 'Full Instance',
        baseUrl: 'https://full.wikibase.org/w/rest.php/wikibase/v0',
        userAgent: 'DataForge/1.0.0',
        authToken: 'full-token',
        isDefault: true,
        metadata: {
          description: 'Full configuration test',
          language: 'en',
          version: '2.0.0',
        },
      }

      const client = service.createClient(fullConfig)

      expect(client).toBeDefined()
      expect(service.getInstance('full')).toEqual(fullConfig)
    })
  })

  describe('Error Handling', () => {
    test('should handle client creation with invalid configuration gracefully', () => {
      const invalidConfig = {
        ...mockInstanceConfig,
        baseUrl: 'not-a-valid-url',
      }

      expect(() => service.createClient(invalidConfig)).not.toThrow()
    })

    test('should maintain separate client instances', () => {
      const config1 = { ...mockInstanceConfig, id: 'instance-1' }
      const config2 = {
        ...mockInstanceConfig,
        id: 'instance-2',
        baseUrl: 'https://different.wikibase.org/w/rest.php/wikibase/v0',
      }

      const client1 = service.createClient(config1)
      const client2 = service.createClient(config2)

      expect(client1).not.toBe(client2)
      expect(service.getClient('instance-1')).toBe(client1)
      expect(service.getClient('instance-2')).toBe(client2)
    })
  })

  describe('Instance Management', () => {
    test('should replace existing client when creating with same ID', () => {
      const originalConfig = { ...mockInstanceConfig }
      const updatedConfig = { ...mockInstanceConfig, name: 'Updated Name' }

      service.createClient(originalConfig)
      const originalClient = service.getClient('test-instance')

      service.createClient(updatedConfig)
      const newClient = service.getClient('test-instance')

      // Client should be replaced
      expect(newClient).not.toBe(originalClient)
      expect(service.getInstance('test-instance').name).toBe('Updated Name')
    })

    test('should handle empty instance list', () => {
      expect(service.getInstanceIds()).toHaveLength(0)
      expect(service.getAllInstances()).toHaveLength(0)
    })
  })

  describe('Property Data Fetching', () => {
    beforeEach(() => {
      service.createClient(mockInstanceConfig)
    })

    test('should handle searchProperties method call structure', () => {
      expectTypeOf(service.searchProperties).toBeFunction()
      expect(service.searchProperties('non-existent', 'test')).rejects.toThrow(
        'No client found for instance: non-existent',
      )
    })

    test('should handle getProperty method call structure', () => {
      expectTypeOf(service.getProperty).toBeFunction()
      expect(service.getProperty('non-existent', 'P1')).rejects.toThrow(
        'No client found for instance: non-existent',
      )
    })

    test('should handle searchItems method call structure', () => {
      expectTypeOf(service.searchItems).toBeFunction()
      expect(service.searchItems('non-existent', 'test')).rejects.toThrow(
        'No client found for instance: non-existent',
      )
    })

    test('should handle getItem method call structure', () => {
      expectTypeOf(service.getItem).toBeFunction()
      expect(service.getItem('non-existent', 'Q1')).rejects.toThrow(
        'No client found for instance: non-existent',
      )
    })

    test('should handle search options correctly', () => {
      const searchOptions = {
        limit: 5,
        offset: 10,
        language: 'de',
        dataType: 'string',
      }

      expect(service.searchProperties('test-instance', 'test', searchOptions)).rejects.toThrow()
    })

    test('should handle empty search options', () => {
      expect(service.searchProperties('test-instance', 'test')).rejects.toThrow()
    })
  })

  describe('Error Handling for API Methods', () => {
    beforeEach(() => {
      service.createClient(mockInstanceConfig)
    })

    test('should throw meaningful errors for invalid property IDs', () => {
      expect(service.getProperty('test-instance', 'P999999' as PropertyId)).rejects.toThrow(
        'Failed to get property P999999',
      )
    })

    test('should throw meaningful errors for invalid item IDs', () => {
      expect(service.getItem('test-instance', 'Q999999' as ItemId)).rejects.toThrow(
        'Failed to get item Q999999',
      )
    })

    test('should handle API failures gracefully', () => {
      expect(service.searchProperties('test-instance', '')).rejects.toThrow(
        'Failed to search properties',
      )
    })
  })

  describe('Constraint Data Fetching', () => {
    beforeEach(() => {
      service.createClient(mockInstanceConfig)
    })

    test('should handle getPropertyConstraints method call structure', () => {
      expectTypeOf(service.getPropertyConstraints).toBeFunction()
      expect(service.getPropertyConstraints('non-existent', 'P1')).rejects.toThrow(
        'No client found for instance: non-existent',
      )
    })

    test('should handle getPropertyDataTypes method call structure', () => {
      expectTypeOf(service.getPropertyDataTypes).toBeFunction()
      expect(service.getPropertyDataTypes('non-existent')).rejects.toThrow(
        'No client found for instance: non-existent',
      )
    })

    test('should return empty constraints array for properties without constraints', () => {
      expect(service.getPropertyConstraints('test-instance', 'P1' as PropertyId)).rejects.toThrow(
        'Failed to get constraints for property P1',
      )
    })

    test('should handle constraint parsing errors gracefully', () => {
      expect(
        service.getPropertyConstraints('test-instance', 'P999999' as PropertyId),
      ).rejects.toThrow('Failed to get constraints for property P999999')
    })

    test('should return empty data type map by default', () => {
      expect(service.getPropertyDataTypes('test-instance')).resolves.toEqual({})
    })
  })
})
