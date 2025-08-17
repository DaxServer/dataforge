import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { databasePlugin } from '@backend/plugins/database'
import { errorHandlerPlugin } from '@backend/plugins/error-handler'
import { wikibasePlugin } from '@backend/plugins/wikibase'
import { ApiError } from '@backend/types/error-schemas'
import type { PropertyId, ItemId } from 'wikibase-sdk'

// TypeBox schemas for response types
const StatementValue = t.Object({
  type: t.String(),
  content: t.Any(),
})

const Qualifier = t.Object({
  property: t.String(),
  value: StatementValue,
})

const ReferencePart = t.Object({
  property: t.String(),
  value: StatementValue,
})

const Reference = t.Object({
  parts: t.Array(ReferencePart),
})

const Statement = t.Object({
  id: t.String(),
  property: t.String(),
  value: StatementValue,
  qualifiers: t.Optional(t.Array(Qualifier)),
  references: t.Optional(t.Array(Reference)),
  rank: t.Union([t.Literal('preferred'), t.Literal('normal'), t.Literal('deprecated')]),
})

const PropertyConstraint = t.Object({
  type: t.String(),
  parameters: t.Record(t.String(), t.Any()),
  description: t.Optional(t.String()),
  violationMessage: t.Optional(t.String()),
})

const PropertySearchResult = t.Object({
  id: t.String(),
  label: t.String(),
  description: t.Optional(t.String()),
  dataType: t.String(),
  match: t.Object({
    type: t.Union([t.Literal('label'), t.Literal('alias'), t.Literal('description')]),
    text: t.String(),
  }),
})

const PropertyDetails = t.Object({
  id: t.String(),
  labels: t.Record(t.String(), t.String()),
  descriptions: t.Record(t.String(), t.String()),
  aliases: t.Record(t.String(), t.Array(t.String())),
  dataType: t.String(),
  statements: t.Array(Statement),
  constraints: t.Optional(t.Array(PropertyConstraint)),
})

const ItemSearchResult = t.Object({
  id: t.String(),
  label: t.String(),
  description: t.Optional(t.String()),
  match: t.Object({
    type: t.Union([t.Literal('label'), t.Literal('alias'), t.Literal('description')]),
    text: t.String(),
  }),
})

const SiteLink = t.Object({
  site: t.String(),
  title: t.String(),
  badges: t.Optional(t.Array(t.String())),
})

const ItemDetails = t.Object({
  id: t.String(),
  labels: t.Record(t.String(), t.String()),
  descriptions: t.Record(t.String(), t.String()),
  aliases: t.Record(t.String(), t.Array(t.String())),
  statements: t.Array(Statement),
  sitelinks: t.Optional(t.Record(t.String(), SiteLink)),
})

const PropertySearchResponse = t.Object({
  results: t.Array(PropertySearchResult),
  totalCount: t.Number(),
  hasMore: t.Boolean(),
  query: t.String(),
})

const ItemSearchResponse = t.Object({
  results: t.Array(ItemSearchResult),
  totalCount: t.Number(),
  hasMore: t.Boolean(),
  query: t.String(),
})

/**
 * Wikibase entity search and retrieval API endpoints
 */
export const wikibaseEntitiesApi = new Elysia({ prefix: '/api/wikibase/entities' })
  .use(cors())
  .use(databasePlugin)
  .use(errorHandlerPlugin)
  .use(wikibasePlugin)

  // Search properties
  .get(
    '/properties/search',
    async ({ query: { q, instance = 'wikidata', limit = 10, offset = 0 }, wikibase }) => {
      const results = await wikibase.searchProperties(instance, q, {
        limit: Number(limit),
        offset: Number(offset),
      })
      return { data: results }
    },
    {
      query: t.Object({
        q: t.String({ description: 'Search query for properties' }),
        instance: t.Optional(
          t.String({ description: 'Wikibase instance ID', default: 'wikidata' }),
        ),
        limit: t.Optional(t.String({ description: 'Maximum number of results', default: '10' })),
        offset: t.Optional(t.String({ description: 'Offset for pagination', default: '0' })),
      }),
      response: {
        200: t.Object({ data: PropertySearchResponse }),
        400: ApiError,
        500: ApiError,
      },
      detail: {
        summary: 'Search Wikibase properties',
        description: 'Search for properties in a Wikibase instance with autocomplete support',
        tags: ['Wikibase', 'Properties', 'Search'],
      },
    },
  )

  // Get property details
  .get(
    '/properties/:propertyId',
    async ({ params: { propertyId }, query: { instance = 'wikidata' }, wikibase }) => {
      const property = await wikibase.getProperty(instance, propertyId as PropertyId)
      return { data: property }
    },
    {
      params: t.Object({
        propertyId: t.String({ description: 'Property ID (e.g., P31)' }),
      }),
      query: t.Object({
        instance: t.Optional(
          t.String({ description: 'Wikibase instance ID', default: 'wikidata' }),
        ),
      }),
      response: {
        200: t.Object({ data: PropertyDetails }),
        400: ApiError,
        404: ApiError,
        500: ApiError,
      },
      detail: {
        summary: 'Get property details',
        description: 'Retrieve detailed information about a specific property',
        tags: ['Wikibase', 'Properties'],
      },
    },
  )

  // Search items
  .get(
    '/items/search',
    async ({ query: { q, instance = 'wikidata', limit = 10, offset = 0 }, wikibase }) => {
      const results = await wikibase.searchItems(instance, q, {
        limit: Number(limit),
        offset: Number(offset),
      })
      return { data: results }
    },
    {
      query: t.Object({
        q: t.String({ description: 'Search query for items' }),
        instance: t.Optional(
          t.String({ description: 'Wikibase instance ID', default: 'wikidata' }),
        ),
        limit: t.Optional(t.String({ description: 'Maximum number of results', default: '10' })),
        offset: t.Optional(t.String({ description: 'Offset for pagination', default: '0' })),
      }),
      response: {
        200: t.Object({ data: ItemSearchResponse }),
        400: ApiError,
        500: ApiError,
      },
      detail: {
        summary: 'Search Wikibase items',
        description: 'Search for items in a Wikibase instance with autocomplete support',
        tags: ['Wikibase', 'Items', 'Search'],
      },
    },
  )

  // Get item details
  .get(
    '/items/:itemId',
    async ({ params: { itemId }, query: { instance = 'wikidata' }, wikibase }) => {
      const item = await wikibase.getItem(instance, itemId as ItemId)
      return { data: item }
    },
    {
      params: t.Object({
        itemId: t.String({ description: 'Item ID (e.g., Q42)' }),
      }),
      query: t.Object({
        instance: t.Optional(
          t.String({ description: 'Wikibase instance ID', default: 'wikidata' }),
        ),
      }),
      response: {
        200: t.Object({ data: ItemDetails }),
        400: ApiError,
        404: ApiError,
        500: ApiError,
      },
      detail: {
        summary: 'Get item details',
        description: 'Retrieve detailed information about a specific item',
        tags: ['Wikibase', 'Items'],
      },
    },
  )
