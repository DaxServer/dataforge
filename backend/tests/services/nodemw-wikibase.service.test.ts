import { describe, test, expect } from 'bun:test'
import { NodemwWikibaseService } from '@backend/services/nodemw-wikibase.service'
import type { WikibaseInstanceConfig } from '@backend/types/wikibase-api'

describe('NodemwWikibaseService', () => {
  const service = new NodemwWikibaseService()

  const testInstanceConfig: WikibaseInstanceConfig = {
    id: 'test-wikidata',
    name: 'Test Wikidata',
    baseUrl: 'https://www.wikidata.org',
    userAgent: 'DataForge/1.0 Test',
  }

  test('should create a client for a Wikibase instance', () => {
    const client = service.createClient(testInstanceConfig)

    expect(client).toBeDefined()
    expect(service.hasClient('test-wikidata')).toBe(true)
  })

  test('should get an existing client', () => {
    service.createClient(testInstanceConfig)

    const client = service.getClient('test-wikidata')
    expect(client).toBeDefined()
  })

  test('should throw error when getting non-existent client', () => {
    expect(() => service.getClient('non-existent')).toThrow(
      'No client found for instance: non-existent',
    )
  })

  test('should get instance configuration', () => {
    // Create client first
    service.createClient(testInstanceConfig)

    const instance = service.getInstance('test-wikidata')
    expect(instance).toEqual(testInstanceConfig)
  })

  test('should throw error when getting non-existent instance', () => {
    expect(() => service.getInstance('non-existent')).toThrow(
      'No instance configuration found for: non-existent',
    )
  })

  test('should remove client and configuration', () => {
    // Create client first
    service.createClient(testInstanceConfig)
    expect(service.hasClient('test-wikidata')).toBe(true)

    const removed = service.removeClient('test-wikidata')
    expect(removed).toBe(true)
    expect(service.hasClient('test-wikidata')).toBe(false)
  })

  test('should get all instance IDs', () => {
    const config1 = { ...testInstanceConfig, id: 'instance1' }
    const config2 = { ...testInstanceConfig, id: 'instance2' }

    service.createClient(config1)
    service.createClient(config2)

    const instanceIds = service.getInstanceIds()
    expect(instanceIds).toContain('instance1')
    expect(instanceIds).toContain('instance2')

    // Cleanup
    service.removeClient('instance1')
    service.removeClient('instance2')
  })

  test('should get all instances', () => {
    const config1 = { ...testInstanceConfig, id: 'instance1' }
    const config2 = { ...testInstanceConfig, id: 'instance2' }

    service.createClient(config1)
    service.createClient(config2)

    const instances = service.getAllInstances()
    expect(instances).toHaveLength(2)
    expect(instances.find(i => i.id === 'instance1')).toBeDefined()
    expect(instances.find(i => i.id === 'instance2')).toBeDefined()

    // Cleanup
    service.removeClient('instance1')
    service.removeClient('instance2')
  })

  test('should create Wikidata client for constraint validation', () => {
    // Create main client first
    service.createClient(testInstanceConfig)

    const wikidataClient = service.getWikidataClient('test-wikidata')
    expect(wikidataClient).toBeDefined()

    // Should return the same client on subsequent calls
    const wikidataClient2 = service.getWikidataClient('test-wikidata')
    expect(wikidataClient2).toBe(wikidataClient)

    // Cleanup
    service.removeClient('test-wikidata')
  })
})
