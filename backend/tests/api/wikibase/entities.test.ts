import { wikibaseEntitiesApi } from '@backend/api/wikibase/entities'
import { wikibaseService } from '@backend/services/wikibase.service'
import { treaty } from '@elysiajs/eden'
import { beforeEach, describe, expect, test } from 'bun:test'
import Elysia from 'elysia'

// Mock the wikibase service
const mockWikibaseService = {
  getProperty: async (_instanceId: string, propertyId: string) => {
    if (propertyId === 'P1000000') {
      return null // Simulate not found
    }
    return {
      id: propertyId,
      type: 'property' as const,
      datatype: 'wikibase-item',
      labels: { en: 'Test Property' },
      descriptions: { en: 'A test property' },
      aliases: {},
      claims: {},
    }
  },
  getItem: async (_instanceId: string, itemId: string) => {
    if (itemId === 'Q1000000') {
      return null // Simulate not found
    }
    return {
      id: itemId,
      type: 'item' as const,
      labels: { en: 'Test Item' },
      descriptions: { en: 'A test item' },
      aliases: {},
      claims: {},
    }
  },
}

// Mock the service
Object.assign(wikibaseService, mockWikibaseService)

const createTestApi = () => {
  return treaty(new Elysia().use(wikibaseEntitiesApi)).api
}

describe('Wikibase Entities API', () => {
  let api: ReturnType<typeof createTestApi>

  beforeEach(() => {
    api = createTestApi()
  })

  describe('Property endpoints', () => {
    test('should return 404 for non-existent property', async () => {
      const { data, status, error } = await api.wikibase.entities.properties({ propertyId: 'P1000000' }).get({
        query: { instance: 'wikidata' },
      })

      expect(data).toBeNull()
      expect(status).toBe(404)
      expect(error).toHaveProperty('value', {
        data: [],
        errors: [
          {
            details: [],
            code: 'NOT_FOUND',
            message: "Property with identifier 'P1000000' not found",
          },
        ],
      })
    })

    test('should return 200 for existing property', async () => {
      const { data, status, error } = await api.wikibase.entities.properties({ propertyId: 'P31' }).get({
        query: { instance: 'wikidata' },
      })

      expect(data).toEqual({
        data: {
          id: 'P31',
          type: 'property',
          datatype: 'wikibase-item',
          labels: { en: 'Test Property' },
          descriptions: { en: 'A test property' },
          aliases: {},
          claims: {},
        },
      })
      expect(status).toBe(200)
      expect(error).toBeNull()
    })
  })

  describe('Item endpoints', () => {
    test('should return 404 for non-existent item', async () => {
      const { data, status, error } = await api.wikibase.entities.items({ itemId: 'Q1000000' }).get({
        query: { instance: 'wikidata' },
      })

      expect(data).toBeNull()
      expect(status).toBe(404)
      expect(error).toHaveProperty('value', {
        data: [],
        errors: [
          {
            details: [],
            code: 'NOT_FOUND',
            message: "Item with identifier 'Q1000000' not found",
          },
        ],
      })
    })
  })

  describe('Item endpoints', () => {
    test('should return 404 for non-existent item', async () => {
      const { data, status, error } = await api.wikibase.entities.items({ itemId: 'Q1000000' }).get({
        query: { instance: 'wikidata' },
      })

      expect(data).toBeNull()
      expect(status).toBe(404)
      expect(error).toHaveProperty('value', {
          data: [],
          errors: [
            {
              details: [],
              code: 'NOT_FOUND',
              message: "Item with identifier 'Q1000000' not found",
            },
          ],
        })
    })

    test('should return 200 for existing item', async () => {
      const { data, status, error } = await api.wikibase.entities.items({ itemId: 'Q1' }).get({
        query: { instance: 'wikidata' },
      })

      expect(data).toEqual({
        data: {
          id: 'Q1',
          type: 'item',
          labels: {
            en: 'Test Item',
          },
          descriptions: {
            en: 'A test item',
          },
          aliases: {},
          claims: {},
        },
      })
      expect(status).toBe(200)
      expect(error).toBeNull()
    })
  })
})
