import { WikibaseConfigService } from '@backend/services/wikibase-config.service'
import type { WikibaseInstanceConfig } from '@backend/types/wikibase-api'
import { beforeEach, describe, expect, test } from 'bun:test'

describe('WikibaseConfigService', () => {
  let service: WikibaseConfigService
  let mockCustomConfig: WikibaseInstanceConfig

  beforeEach(() => {
    service = new WikibaseConfigService()
    mockCustomConfig = {
      id: 'custom-test',
      name: 'Custom Test Instance',
      baseUrl: 'https://custom.wikibase.org/w/rest.php/wikibase/v0',
      userAgent: 'DataForge/1.0.0 (test)',
      isDefault: false,
      metadata: {
        description: 'Custom test instance',
        language: 'en',
        version: '1.0.0',
      },
    }
  })

  describe('Initialization', () => {
    test('should initialize with pre-defined instances', () => {
      expect(service.getInstances()).resolves.toEqual([
        {
          id: 'wikidata',
          name: 'Wikidata',
          baseUrl: 'https://www.wikidata.org/w/rest.php/wikibase/v1',
          userAgent: 'DataForge/1.0 (https://github.com/DaxServer/dataforge)',
          isDefault: true,
          metadata: {
            description: 'The free knowledge base that anyone can edit',
            language: 'en',
            version: 'v1',
          },
        },
      ])
    })

    test('should have Wikidata as default instance', () => {
      expect(service.getDefaultInstance()).resolves.toEqual({
        id: 'wikidata',
        name: 'Wikidata',
        baseUrl: 'https://www.wikidata.org/w/rest.php/wikibase/v1',
        userAgent: 'DataForge/1.0 (https://github.com/DaxServer/dataforge)',
        isDefault: true,
        metadata: {
          description: 'The free knowledge base that anyone can edit',
          language: 'en',
          version: 'v1',
        },
      })
    })

    test('should return pre-defined instances correctly', async () => {
      const predefinedInstances = await service.getPredefinedInstances()

      expect(predefinedInstances.length).toBe(1)
      expect(predefinedInstances.some((i) => i.id === 'wikidata')).toBe(true)
    })
  })

  describe('Instance Retrieval', () => {
    test('should get instance by ID', async () => {
      expect(service.getInstance('wikidata')).resolves.toEqual({
        id: 'wikidata',
        name: 'Wikidata',
        baseUrl: 'https://www.wikidata.org/w/rest.php/wikibase/v1',
        userAgent: 'DataForge/1.0 (https://github.com/DaxServer/dataforge)',
        isDefault: true,
        metadata: {
          description: 'The free knowledge base that anyone can edit',
          language: 'en',
          version: 'v1',
        },
      })
    })

    test('should throw error for non-existent instance', () => {
      expect(service.getInstance('non-existent')).rejects.toThrow(
        'Instance not found: non-existent',
      )
    })

    test('should return instances sorted by default status and name', async () => {
      await service.addInstance(mockCustomConfig)
      const instances = await service.getInstances()

      // Default instance should be first
      expect(instances[0]!.isDefault).toBe(true)

      // Non-default instances should be sorted by name
      const nonDefaultInstances = instances.filter((i) => !i.isDefault)
      for (let i = 1; i < nonDefaultInstances.length; i++) {
        const current = nonDefaultInstances[i]
        const previous = nonDefaultInstances[i - 1]
        if (current && previous) {
          expect(current.name >= previous.name).toBe(true)
        }
      }
    })
  })

  describe('Custom Instance Management', () => {
    test('should add valid custom instance', async () => {
      await service.addInstance(mockCustomConfig)

      const instance = await service.getInstance('custom-test')
      expect(instance).toEqual(mockCustomConfig)

      const customInstances = await service.getCustomInstances()
      expect(customInstances.length).toBe(1)
      expect(customInstances[0]!.id).toBe('custom-test')
    })

    test('should throw error when adding instance with existing ID', async () => {
      await service.addInstance(mockCustomConfig)

      expect(service.addInstance(mockCustomConfig)).rejects.toThrow(
        "Instance with ID 'custom-test' already exists",
      )
    })

    test('should throw error when adding instance with pre-defined ID', async () => {
      const configWithExistingId = { ...mockCustomConfig, id: 'wikidata' }

      expect(service.addInstance(configWithExistingId)).rejects.toThrow(
        "Instance with ID 'wikidata' already exists",
      )
    })

    test('should update custom instance', async () => {
      await service.addInstance(mockCustomConfig)

      const updates = { name: 'Updated Name', metadata: { description: 'Updated description' } }
      await service.updateInstance('custom-test', updates)

      const updatedInstance = await service.getInstance('custom-test')
      expect(updatedInstance.name).toBe('Updated Name')
      expect(updatedInstance.metadata?.description).toBe('Updated description')
    })

    test('should throw error when updating pre-defined instance', () => {
      expect(service.updateInstance('wikidata', { name: 'New Name' })).rejects.toThrow(
        'Cannot update pre-defined instance configurations',
      )
    })

    test('should throw error when updating non-existent instance', () => {
      expect(service.updateInstance('non-existent', { name: 'New Name' })).rejects.toThrow(
        'Instance not found: non-existent',
      )
    })

    test('should remove custom instance', async () => {
      await service.addInstance(mockCustomConfig)
      expect(await service.getCustomInstances()).toHaveLength(1)

      await service.removeInstance('custom-test')

      expect(service.getCustomInstances()).resolves.toHaveLength(0)
      expect(service.getInstance('custom-test')).rejects.toThrow()
    })

    test('should throw error when removing pre-defined instance', () => {
      expect(service.removeInstance('wikidata')).rejects.toThrow(
        'Cannot remove pre-defined instance configurations',
      )
    })

    test('should throw error when removing non-existent custom instance', () => {
      expect(service.removeInstance('non-existent')).rejects.toThrow(
        'Custom instance not found: non-existent',
      )
    })
  })

  describe('Instance Type Checking', () => {
    test('should correctly identify pre-defined instances', () => {
      expect(service.isPredefinedInstance('wikidata')).toBe(true)
      expect(service.isPredefinedInstance('custom-test')).toBe(false)
    })

    test('should correctly identify custom instances', async () => {
      expect(service.isCustomInstance('custom-test')).toBe(false)

      await service.addInstance(mockCustomConfig)

      expect(service.isCustomInstance('custom-test')).toBe(true)
      expect(service.isCustomInstance('wikidata')).toBe(false)
    })
  })

  describe('Default Instance Management', () => {
    test('should set custom instance as default', async () => {
      await service.addInstance(mockCustomConfig)
      await service.setDefaultInstance('custom-test')

      const defaultInstance = await service.getDefaultInstance()
      expect(defaultInstance?.id).toBe('custom-test')
      expect(defaultInstance?.isDefault).toBe(true)

      // Previous default should no longer be default
      const wikidata = await service.getInstance('wikidata')
      expect(wikidata.isDefault).toBe(false)
    })

    test('should clear default instance', async () => {
      await service.clearDefaultInstance()

      const defaultInstance = await service.getDefaultInstance()
      expect(defaultInstance).toBeNull()
    })

    test('should throw error when adding second default instance', () => {
      const defaultConfig = { ...mockCustomConfig, isDefault: true }

      expect(service.addInstance(defaultConfig)).rejects.toThrow(
        'A default instance already exists',
      )
    })

    test('should throw error when updating to default if default exists', async () => {
      await service.addInstance(mockCustomConfig)

      expect(service.updateInstance('custom-test', { isDefault: true })).rejects.toThrow(
        'A default instance already exists',
      )
    })
  })

  describe('Configuration Validation', () => {
    test('should validate valid configuration', async () => {
      const result = await service.validateInstance(mockCustomConfig)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should reject configuration with missing required fields', async () => {
      const invalidConfig = {
        id: '',
        name: '',
        baseUrl: '',
        userAgent: '',
      } as WikibaseInstanceConfig

      const result = await service.validateInstance(invalidConfig)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Instance ID is required and must be a non-empty string')
      expect(result.errors).toContain('Instance name is required and must be a non-empty string')
      expect(result.errors).toContain('Base URL is required and must be a non-empty string')
      expect(result.errors).toContain('User agent is required and must be a non-empty string')
    })

    test('should reject configuration with invalid URL', async () => {
      const invalidConfig = { ...mockCustomConfig, baseUrl: 'not-a-url' }

      const result = await service.validateInstance(invalidConfig)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Base URL must be a valid URL')
    })

    test('should reject configuration with non-HTTP(S) URL', async () => {
      const invalidConfig = { ...mockCustomConfig, baseUrl: 'ftp://example.com' }

      const result = await service.validateInstance(invalidConfig)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Base URL must use HTTP or HTTPS protocol')
    })

    test('should reject configuration with invalid ID format', async () => {
      const invalidConfig = { ...mockCustomConfig, id: 'Invalid ID!' }

      const result = await service.validateInstance(invalidConfig)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'Instance ID must contain only lowercase letters, numbers, hyphens, and underscores',
      )
    })

    test('should reject configuration with too long ID', async () => {
      const invalidConfig = { ...mockCustomConfig, id: 'a'.repeat(51) }

      const result = await service.validateInstance(invalidConfig)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Instance ID must be 50 characters or less')
    })

    test('should reject configuration with too long name', async () => {
      const invalidConfig = { ...mockCustomConfig, name: 'a'.repeat(101) }

      const result = await service.validateInstance(invalidConfig)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Instance name must be 100 characters or less')
    })

    test('should reject configuration with too long user agent', async () => {
      const invalidConfig = { ...mockCustomConfig, userAgent: 'a'.repeat(201) }

      const result = await service.validateInstance(invalidConfig)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('User agent must be 200 characters or less')
    })

    test('should warn about empty auth token', async () => {
      const configWithEmptyToken = { ...mockCustomConfig, authToken: '' }

      const result = await service.validateInstance(configWithEmptyToken)

      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('Auth token is empty - authentication will not be used')
    })

    test('should reject configuration with invalid auth token type', async () => {
      const invalidConfig = { ...mockCustomConfig, authToken: 123 as any }

      const result = await service.validateInstance(invalidConfig)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Auth token must be a string')
    })

    test('should reject configuration with invalid metadata', async () => {
      const invalidConfig = { ...mockCustomConfig, metadata: 'invalid' as any }

      const result = await service.validateInstance(invalidConfig)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Metadata must be an object')
    })

    test('should reject configuration with invalid metadata fields', async () => {
      const invalidConfig = {
        ...mockCustomConfig,
        metadata: {
          description: 123,
          language: true,
          version: [],
        } as any,
      }

      const result = await service.validateInstance(invalidConfig)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Metadata description must be a string')
      expect(result.errors).toContain('Metadata language must be a string')
      expect(result.errors).toContain('Metadata version must be a string')
    })
  })

  describe('Reset Functionality', () => {
    test('should reset to default configuration', async () => {
      // Add custom instances
      await service.addInstance(mockCustomConfig)
      await service.setDefaultInstance('custom-test')

      expect(await service.getCustomInstances()).toHaveLength(1)
      expect((await service.getDefaultInstance())?.id).toBe('custom-test')

      // Reset
      await service.resetToDefaults()

      expect(service.getCustomInstances()).resolves.toHaveLength(0)
      expect(service.getDefaultInstance()).resolves.toEqual({
        id: 'wikidata',
        name: 'Wikidata',
        baseUrl: 'https://www.wikidata.org/w/rest.php/wikibase/v1',
        userAgent: 'DataForge/1.0 (https://github.com/DaxServer/dataforge)',
        isDefault: true,
        metadata: {
          description: 'The free knowledge base that anyone can edit',
          language: 'en',
          version: 'v1',
        },
      })

      expect(service.getInstances()).resolves.toHaveLength(1) // Only pre-defined instances
    })
  })

  describe('Edge Cases', () => {
    test('should handle minimal valid configuration', async () => {
      const minimalConfig: WikibaseInstanceConfig = {
        id: 'minimal',
        name: 'Minimal',
        baseUrl: 'https://minimal.org/api',
        userAgent: 'Test/1.0',
      }

      const result = await service.validateInstance(minimalConfig)
      expect(result.isValid).toBe(true)

      await service.addInstance(minimalConfig)
      expect(service.getInstance('minimal')).resolves.toEqual(minimalConfig)
    })

    test('should handle configuration with all optional fields', async () => {
      const fullConfig: WikibaseInstanceConfig = {
        id: 'full-config',
        name: 'Full Configuration',
        baseUrl: 'https://full.org/api',
        userAgent: 'Test/1.0',
        authToken: 'token123',
        isDefault: false,
        metadata: {
          description: 'Full configuration test',
          language: 'de',
          version: '2.0.0',
        },
      }

      const result = await service.validateInstance(fullConfig)
      expect(result.isValid).toBe(true)

      await service.addInstance(fullConfig)
      expect(service.getInstance('full-config')).resolves.toEqual(fullConfig)
    })

    test('should handle concurrent operations safely', async () => {
      const configs = Array.from({ length: 5 }, (_, i) => ({
        ...mockCustomConfig,
        id: `concurrent-${i}`,
        name: `Concurrent ${i}`,
      }))

      // Add multiple instances concurrently
      await Promise.all(configs.map((config) => service.addInstance(config)))

      const instances = await service.getInstances()
      const customInstances = instances.filter((i) => i.id.startsWith('concurrent-'))
      expect(customInstances).toHaveLength(5)
    })
  })
})
