import type { ItemId, PropertyId } from 'wikibase-sdk'

// Property handlers
export const searchProperties = async ({
  query: {
    q,
    instance = 'wikidata',
    limit = '10',
    offset = '0',
    language = 'en',
    dataType,
    autocomplete = 'true',
  },
  wikibase,
}: {
  query: {
    q: string
    instance?: string
    limit?: string
    offset?: string
    language?: string
    dataType?: string
    autocomplete?: string
  }
  wikibase: any
}) => {
  const results = await wikibase.searchProperties(instance, q, {
    limit: Number(limit),
    offset: Number(offset),
    language,
    dataType,
    autocomplete: autocomplete === 'true',
  })
  return { data: results }
}

export const getPropertyDetails = async ({
  params: { propertyId },
  query: { instance = 'wikidata' },
  wikibase,
}: {
  params: { propertyId: string }
  query: { instance?: string }
  wikibase: any
}) => {
  const property = await wikibase.getProperty(instance, propertyId as PropertyId)
  return { data: property }
}

// Item handlers
export const searchItems = async ({
  query: {
    q,
    instance = 'wikidata',
    limit = '10',
    offset = '0',
    language = 'en',
    autocomplete = 'true',
  },
  wikibase,
}: {
  query: {
    q: string
    instance?: string
    limit?: string
    offset?: string
    language?: string
    autocomplete?: string
  }
  wikibase: any
}) => {
  const results = await wikibase.searchItems(instance, q, {
    limit: Number(limit),
    offset: Number(offset),
    language,
    autocomplete: autocomplete === 'true',
  })
  return { data: results }
}

export const getItemDetails = async ({
  params: { itemId },
  query: { instance = 'wikidata' },
  wikibase,
}: {
  params: { itemId: string }
  query: { instance?: string }
  wikibase: any
}) => {
  const item = await wikibase.getItem(instance, itemId as ItemId)
  return { data: item }
}
