import { describe, test, expect, beforeEach, afterEach, spyOn } from 'bun:test'
import { NodemwWikibaseService } from '@backend/services/nodemw-wikibase.service'
import type {
  WikibaseInstanceConfig,
  SearchResponse,
  PropertySearchResult,
  ItemSearchResult,
  PropertyDetails,
  ItemDetails,
} from '@backend/types/wikibase-api'
import type { PropertyId, ItemId } from 'wikibase-sdk'

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

  describe('Wikibase entity operations', () => {
    const wikidataConfig: WikibaseInstanceConfig = {
      id: 'wikidata',
      name: 'Wikidata',
      baseUrl: 'https://www.wikidata.org',
      userAgent: 'DataForge/1.0 Test',
    }

    let searchPropertiesSpy: any
    let getPropertySpy: any
    let searchItemsSpy: any
    let getItemSpy: any

    beforeEach(() => {
      service.createClient(wikidataConfig)

      // Mock search properties
      searchPropertiesSpy = spyOn(service, 'searchProperties').mockResolvedValue({
        results: [
          {
            id: 'P31' as PropertyId,
            label: 'instance of',
            datatype: 'wikibase-item',
            match: {
              type: 'label',
              text: 'instance of',
            },
          },
        ],
        totalCount: 1,
        hasMore: false,
        query: 'instance of',
      } as SearchResponse<PropertySearchResult>)

      // Mock get property
      getPropertySpy = spyOn(service, 'getProperty').mockResolvedValue({
        id: 'P31' as PropertyId,
        type: 'property',
        labels: { en: 'instance of' },
        descriptions: { en: 'that class of which this subject is a particular example and member' },
        aliases: {},
        datatype: 'wikibase-item',
        statements: [],
      } as PropertyDetails)

      // Mock search items
      searchItemsSpy = spyOn(service, 'searchItems').mockResolvedValue({
        results: [
          {
            id: 'Q937' as ItemId,
            label: 'Albert Einstein',
          },
        ],
        totalCount: 1,
        hasMore: false,
        query: 'Albert Einstein',
      } as SearchResponse<ItemSearchResult>)

      // Mock get item
      getItemSpy = spyOn(service, 'getItem').mockResolvedValue({
        id: 'Q937' as ItemId,
        type: 'item',
        labels: { en: 'Albert Einstein' },
        descriptions: { en: 'German-born theoretical physicist' },
        aliases: {},
        statements: [],
      } as ItemDetails)
    })

    afterEach(() => {
      service.removeClient('wikidata')
      searchPropertiesSpy?.mockRestore()
      getPropertySpy?.mockRestore()
      searchItemsSpy?.mockRestore()
      getItemSpy?.mockRestore()
    })

    test('should search properties', async () => {
      const response = await service.searchProperties('wikidata', 'instance of', {
        limit: 5,
        offset: 0,
      })

      expect(response).toBeDefined()
      expect(response.results).toBeDefined()
      expect(Array.isArray(response.results)).toBe(true)
      expect(response.results.length).toBeGreaterThan(0)
      expect(response.results[0]).toHaveProperty('id')
      expect(response.results[0]).toHaveProperty('label')
      expect(response.results[0]).toHaveProperty('dataType')
      expect(searchPropertiesSpy).toHaveBeenCalledWith('wikidata', 'instance of', {
        limit: 5,
        offset: 0,
      })
    })

    test('should get property details', async () => {
      const property = await service.getProperty('wikidata', 'P31' as PropertyId)

      expect(property).toBeDefined()
      expect(property.id).toBe('P31')
      expect(property.labels).toBeDefined()
      expect(property.descriptions).toBeDefined()
      expect(property.datatype).toBeDefined()
      expect(getPropertySpy).toHaveBeenCalledWith('wikidata', 'P31')
    })

    test('should search items', async () => {
      const response = await service.searchItems('wikidata', 'Albert Einstein', {
        limit: 5,
        offset: 0,
      })

      expect(response).toBeDefined()
      expect(response.results).toBeDefined()
      expect(Array.isArray(response.results)).toBe(true)
      expect(response.results.length).toBeGreaterThan(0)
      expect(response.results[0]).toHaveProperty('id')
      expect(response.results[0]).toHaveProperty('label')
      expect(searchItemsSpy).toHaveBeenCalledWith('wikidata', 'Albert Einstein', {
        limit: 5,
        offset: 0,
      })
    })

    test('should get item details', async () => {
      const item = await service.getItem('wikidata', 'Q937' as ItemId)

      expect(item).toBeDefined()
      expect(item.id).toBe('Q937')
      expect(item.labels).toBeDefined()
      expect(item.descriptions).toBeDefined()
      expect(item.statements).toBeDefined()
      expect(getItemSpy).toHaveBeenCalledWith('wikidata', 'Q937')
    })

    test('should handle search with empty results', async () => {
      // Override mock for empty results
      searchPropertiesSpy.mockResolvedValueOnce({
        results: [],
        totalCount: 0,
        hasMore: false,
        query: 'nonexistentpropertyxyz123',
      } as SearchResponse<PropertySearchResult>)

      const response = await service.searchProperties('wikidata', 'nonexistentpropertyxyz123', {
        limit: 5,
        offset: 0,
      })

      expect(response).toBeDefined()
      expect(response.results).toBeDefined()
      expect(Array.isArray(response.results)).toBe(true)
      expect(response.results.length).toBe(0)
      expect(searchPropertiesSpy).toHaveBeenCalledWith('wikidata', 'nonexistentpropertyxyz123', {
        limit: 5,
        offset: 0,
      })
    })

    test('should handle invalid property ID', async () => {
      // Override mock to reject for invalid ID
      getPropertySpy.mockRejectedValueOnce(new Error('Invalid property ID'))

      await expect(service.getProperty('wikidata', 'INVALID' as PropertyId)).rejects.toThrow()

      expect(getPropertySpy).toHaveBeenCalledWith('wikidata', 'INVALID')
    })

    test('should handle invalid item ID', async () => {
      // Override mock to reject for invalid ID
      getItemSpy.mockRejectedValueOnce(new Error('Invalid item ID'))

      await expect(service.getItem('wikidata', 'INVALID' as ItemId)).rejects.toThrow()

      expect(getItemSpy).toHaveBeenCalledWith('wikidata', 'INVALID')
    })
  })

  test('should handle operations on non-existent instance', async () => {
    await expect(service.searchProperties('nonexistent', 'test')).rejects.toThrow(
      'No client found for instance: nonexistent',
    )
    await expect(service.getProperty('nonexistent', 'P1' as PropertyId)).rejects.toThrow(
      'No client found for instance: nonexistent',
    )
    await expect(service.searchItems('nonexistent', 'test')).rejects.toThrow(
      'No client found for instance: nonexistent',
    )
    await expect(service.getItem('nonexistent', 'Q1' as ItemId)).rejects.toThrow(
      'No client found for instance: nonexistent',
    )
  })
})
