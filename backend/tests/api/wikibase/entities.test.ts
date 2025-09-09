import { wikibaseEntitiesApi } from '@backend/api/wikibase/entities'
import { wikibaseService } from '@backend/services/wikibase.service'
import { treaty } from '@elysiajs/eden'
import { beforeEach, describe, expect, test } from 'bun:test'
import Elysia from 'elysia'

// Mock the wikibase service
const mockWikibaseService = {
  getProperty: async () => {
    return null // Simulate not found
  },
  getItem: async () => {
    return null // Simulate not found
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
      const { data, status, error } = await api
        .wikibase({ instanceId: 'wikidata' })
        .properties({ propertyId: 'P1000000' })
        .get({ query: {} })

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
  })

  describe('Item endpoints', () => {
    test('should return 404 for non-existent item', async () => {
      const { data, status, error } = await api
        .wikibase({ instanceId: 'wikidata' })
        .items({ itemId: 'Q1000000' })
        .get()

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

    test('should return 404 when wikibase.getItem throws an error for not found', async () => {
      const { data, status, error } = await api
        .wikibase({ instanceId: 'wikidata' })
        .items({ itemId: 'Q9999999' })
        .get()

      expect(data).toBeNull()
      expect(status).toBe(404)
      expect(error).toHaveProperty('value', {
        data: [],
        errors: [
          {
            details: [],
            code: 'NOT_FOUND',
            message: "Item with identifier 'Q9999999' not found",
          },
        ],
      })
    })
  })

  describe('Item endpoints', () => {
    test('should return 404 for non-existent item', async () => {
      const { data, status, error } = await api
        .wikibase({ instanceId: 'wikidata' })
        .items({ itemId: 'Q1000000' })
        .get()

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
})
