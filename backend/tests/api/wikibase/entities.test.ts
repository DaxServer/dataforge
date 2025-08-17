import { describe, test, expect, spyOn, beforeEach } from 'bun:test'
import { treaty } from '@elysiajs/eden'
import { wikibaseEntitiesApi } from '@backend/api/wikibase/entities'
import { nodemwWikibaseService } from '@backend/services/nodemw-wikibase.service'
import type {
  SearchResponse,
  PropertySearchResult,
  ItemSearchResult,
  PropertyDetails,
  ItemDetails,
} from '@backend/types/wikibase-api'

const api = treaty(wikibaseEntitiesApi)

describe('Wikibase Entities API', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    spyOn(nodemwWikibaseService, 'searchProperties').mockRestore()
    spyOn(nodemwWikibaseService, 'getProperty').mockRestore()
    spyOn(nodemwWikibaseService, 'searchItems').mockRestore()
    spyOn(nodemwWikibaseService, 'getItem').mockRestore()
  })

  test('should search properties with correct parameters', async () => {
    const mockResults: SearchResponse<PropertySearchResult> = {
      results: [
        {
          id: 'P31',
          label: 'instance of',
          description: 'that class of which this subject is a particular example and member',
          dataType: 'wikibase-item',
          match: {
            type: 'label',
            text: 'instance of',
          },
        },
      ],
      totalCount: 1,
      hasMore: false,
      query: 'instance',
    }

    const searchSpy = spyOn(nodemwWikibaseService, 'searchProperties').mockResolvedValue(
      mockResults,
    )

    const response = await api.api.wikibase.entities.properties.search.get({
      query: {
        q: 'instance',
        instance: 'wikidata',
        limit: '5',
        offset: '10',
      },
    })

    expect(searchSpy).toHaveBeenCalledWith('wikidata', 'instance', {
      limit: 5,
      offset: 10,
    })
    expect(response.data).toEqual({ data: mockResults })
  })

  test('should get property details with correct parameters', async () => {
    const mockProperty: PropertyDetails = {
      id: 'P31',
      labels: { en: 'instance of' },
      descriptions: { en: 'that class of which this subject is a particular example and member' },
      aliases: {},
      dataType: 'wikibase-item',
      statements: [],
      constraints: [],
    }

    const getSpy = spyOn(nodemwWikibaseService, 'getProperty').mockResolvedValue(mockProperty)

    const response = await api.api.wikibase.entities.properties({ propertyId: 'P31' }).get({
      query: {
        instance: 'test-instance',
      },
    })

    expect(getSpy).toHaveBeenCalledWith('test-instance', 'P31')
    expect(response.data).toEqual({ data: mockProperty })
  })

  test('should search items with correct parameters', async () => {
    const mockResults: SearchResponse<ItemSearchResult> = {
      results: [
        {
          id: 'Q5',
          label: 'human',
          description: 'common name of Homo sapiens, unique extant species of the genus Homo',
          match: {
            type: 'label',
            text: 'human',
          },
        },
      ],
      totalCount: 1,
      hasMore: false,
      query: 'human',
    }

    const searchSpy = spyOn(nodemwWikibaseService, 'searchItems').mockResolvedValue(mockResults)

    const response = await api.api.wikibase.entities.items.search.get({
      query: {
        q: 'human',
        instance: 'wikidata',
        limit: '3',
        offset: '5',
      },
    })

    expect(searchSpy).toHaveBeenCalledWith('wikidata', 'human', {
      limit: 3,
      offset: 5,
    })
    expect(response.data).toEqual({ data: mockResults })
  })

  test('should get item details with correct parameters', async () => {
    const mockItem: ItemDetails = {
      id: 'Q5',
      labels: { en: 'human' },
      descriptions: { en: 'common name of Homo sapiens, unique extant species of the genus Homo' },
      aliases: {},
      statements: [],
    }

    const getSpy = spyOn(nodemwWikibaseService, 'getItem').mockResolvedValue(mockItem)

    const response = await api.api.wikibase.entities.items({ itemId: 'Q5' }).get({
      query: {
        instance: 'custom-instance',
      },
    })

    expect(getSpy).toHaveBeenCalledWith('custom-instance', 'Q5')
    expect(response.data).toEqual({ data: mockItem })
  })

  test('should use default parameters when not provided', async () => {
    const mockResults: SearchResponse<PropertySearchResult> = {
      results: [],
      totalCount: 0,
      hasMore: false,
      query: 'test',
    }

    const searchSpy = spyOn(nodemwWikibaseService, 'searchProperties').mockResolvedValue(
      mockResults,
    )

    await api.api.wikibase.entities.properties.search.get({
      query: {
        q: 'test',
      },
    })

    expect(searchSpy).toHaveBeenCalledWith('wikidata', 'test', {
      limit: 10,
      offset: 0,
    })
  })
})
