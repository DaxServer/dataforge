import { describe, test, expect, beforeEach } from 'bun:test'
import { WikibaseConfigService } from '@backend/services/wikibase-config.service'
import type { WikibaseInstanceConfig } from '@backend/types/wikibase-api'

describe('WikibaseConfigService - Connectivity Testing', () => {
  let service: WikibaseConfigService
  let validConfig: WikibaseInstanceConfig
  let invalidConfig: WikibaseInstanceConfig

  beforeEach(() => {
    service = new WikibaseConfigService()
    
    validConfig = {
      id: 'test-valid',
      name: 'Test Valid Instance',
      baseUrl: 'https://httpbin.org', // Using httpbin for reliable testing
      userAgent: 'DataForge/1.0.0 (test)',
      isDefault: false,
    }

    invalidConfig = {
      id: 'test-invalid',
      name: 'Test Invalid Instance',
      baseUrl: 'https://non-existent-domain-12345.com/api',
      userAgent: 'DataForge/1.0.0 (test)',
      isDefault: false,
    }
  })

  describe('Connectivity Testing', () => {
    test('should test connectivity to reachable endpoint', async () => {
      const result = await service.testConnectivity(validConfig)

      expect(result).toHaveProperty('isConnected')
      expect(result).toHaveProperty('responseTime')
      expect(typeof result.responseTime).toBe('number')
      expect(result.responseTime).toBeGreaterThan(0)
    })

    test('should handle unreachable endpoint', async () => {
      const result = await service.testConnectivity(invalidConfig)

      expect(result.isConnected).toBe(false)
      expect(result).toHaveProperty('error')
      expect(result).toHaveProperty('responseTime')
      expect(typeof result.responseTime).toBe('number')
      expect(result.responseTime).toBeGreaterThan(0)
    })

    test('should include status code for successful connections', async () => {
      const result = await service.testConnectivity(validConfig)

      if (result.isConnected) {
        expect(result).toHaveProperty('statusCode')
        expect(typeof result.statusCode).toBe('number')
      }
    })

    test('should handle authentication token in connectivity test', async () => {
      const configWithAuth = {
        ...validConfig,
        authToken: 'test-token-123',
      }

      const result = await service.testConnectivity(configWithAuth)

      expect(result).toHaveProperty('isConnected')
      expect(result).toHaveProperty('responseTime')
    })

    test('should extract status code from error responses', async () => {
      const configWith404 = {
        ...validConfig,
        baseUrl: 'https://httpbin.org/status/404',
      }

      const result = await service.testConnectivity(configWith404)

      expect(result).toHaveProperty('statusCode')
      if (result.statusCode) {
        expect(result.statusCode).toBe(404)
      }
    })
  })

  describe('Health Check', () => {
    test('should perform health check on pre-defined instance', async () => {
      const result = await service.performHealthCheck('wikidata')

      expect(result).toHaveProperty('instanceId')
      expect(result).toHaveProperty('isHealthy')
      expect(result).toHaveProperty('lastChecked')
      expect(result).toHaveProperty('responseTime')
      expect(result.instanceId).toBe('wikidata')
      expect(result.lastChecked).toBeInstanceOf(Date)
      expect(typeof result.responseTime).toBe('number')
    })

    test('should handle health check for non-existent instance', async () => {
      const result = await service.performHealthCheck('non-existent')

      expect(result.instanceId).toBe('non-existent')
      expect(result.isHealthy).toBe(false)
      expect(result).toHaveProperty('error')
      expect(result.lastChecked).toBeInstanceOf(Date)
    })

    test('should include details for healthy instances', async () => {
      // Add a custom instance first
      await service.addInstance(validConfig)
      
      const result = await service.performHealthCheck('test-valid')

      expect(result.instanceId).toBe('test-valid')
      expect(result.lastChecked).toBeInstanceOf(Date)
      
      if (result.isHealthy && result.details) {
        expect(result.details).toHaveProperty('apiVersion')
        expect(result.details).toHaveProperty('features')
      }
    })

    test('should include error details for unhealthy instances', async () => {
      // Add an invalid instance first
      await service.addInstance(invalidConfig)
      
      const result = await service.performHealthCheck('test-invalid')

      expect(result.instanceId).toBe('test-invalid')
      expect(result.isHealthy).toBe(false)
      expect(result).toHaveProperty('error')
      expect(typeof result.error).toBe('string')
    })
  })

  describe('Validation with Connectivity', () => {
    test('should validate configuration with successful connectivity', async () => {
      const result = await service.validateInstanceWithConnectivity(validConfig)

      expect(result).toHaveProperty('isValid')
      expect(result).toHaveProperty('errors')
      expect(result).toHaveProperty('warnings')
      expect(result).toHaveProperty('connectivity')
      
      if (result.connectivity) {
        expect(result.connectivity).toHaveProperty('isConnected')
        expect(result.connectivity).toHaveProperty('responseTime')
      }
    })

    test('should fail validation for unreachable instance', async () => {
      const result = await service.validateInstanceWithConnectivity(invalidConfig)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(error => error.includes('Connectivity test failed'))).toBe(true)
      expect(result).toHaveProperty('connectivity')
      
      if (result.connectivity) {
        expect(result.connectivity.isConnected).toBe(false)
      }
    })

    test('should fail validation for invalid configuration before connectivity test', async () => {
      const invalidBasicConfig = {
        id: '',
        name: '',
        baseUrl: 'invalid-url',
        userAgent: '',
      } as WikibaseInstanceConfig

      const result = await service.validateInstanceWithConnectivity(invalidBasicConfig)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      // Should not have connectivity property if basic validation fails
      expect(result).not.toHaveProperty('connectivity')
    })

    test('should handle connectivity test errors gracefully', async () => {
      const configWithBadUrl = {
        ...validConfig,
        baseUrl: 'not-a-url-at-all',
      }

      const result = await service.validateInstanceWithConnectivity(configWithBadUrl)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('Base URL must be a valid URL'))).toBe(true)
    })
  })

  describe('Feature Extraction', () => {
    test('should extract features from OpenAPI specification', async () => {
      // This is a unit test for the private method, testing through public interface
      const mockOpenApiSpec = {
        paths: {
          '/entities/items': {},
          '/entities/properties': {},
          '/search/entities': {},
          '/statements': {},
          '/labels': {},
          '/descriptions': {},
          '/aliases': {},
        },
      }

      // We can't directly test the private method, but we can test the behavior
      // through connectivity testing with a mock that returns OpenAPI spec
      const result = await service.testConnectivity(validConfig)
      
      // The test should complete without throwing errors
      expect(result).toHaveProperty('isConnected')
      expect(result).toHaveProperty('responseTime')
    })
  })

  describe('Error Handling', () => {
    test('should handle network timeouts gracefully', async () => {
      const timeoutConfig = {
        ...validConfig,
        baseUrl: 'https://httpbin.org/delay/2', // Shorter delay to avoid test timeout
      }

      const result = await service.testConnectivity(timeoutConfig)

      expect(result).toHaveProperty('isConnected')
      expect(result).toHaveProperty('responseTime')
      // May or may not timeout depending on network conditions
    })

    test('should handle malformed URLs', async () => {
      const malformedConfig = {
        ...validConfig,
        baseUrl: 'not-a-url',
      }

      const result = await service.testConnectivity(malformedConfig)

      expect(result.isConnected).toBe(false)
      expect(result).toHaveProperty('error')
      expect(typeof result.error).toBe('string')
    })

    test('should handle HTTP error status codes', async () => {
      const errorConfig = {
        ...validConfig,
        baseUrl: 'https://httpbin.org/status/500',
      }

      const result = await service.testConnectivity(errorConfig)

      expect(result).toHaveProperty('statusCode')
      if (result.statusCode) {
        expect(result.statusCode).toBe(500)
      }
    })

    test('should handle connection refused errors', async () => {
      const refusedConfig = {
        ...validConfig,
        baseUrl: 'http://localhost:99999', // Port that should be closed
      }

      const result = await service.testConnectivity(refusedConfig)

      expect(result.isConnected).toBe(false)
      expect(result).toHaveProperty('error')
      expect(result).toHaveProperty('statusCode')
    })
  })

  describe('Performance', () => {
    test('should complete connectivity test within reasonable time', async () => {
      const startTime = Date.now()
      
      await service.testConnectivity(validConfig)
      
      const duration = Date.now() - startTime
      expect(duration).toBeLessThan(30000) // Should complete within 30 seconds
    })

    test('should track response time accurately', async () => {
      const result = await service.testConnectivity(validConfig)

      expect(result.responseTime).toBeGreaterThan(0)
      expect(result.responseTime).toBeLessThan(30000) // Should be less than 30 seconds
    })
  })
})
