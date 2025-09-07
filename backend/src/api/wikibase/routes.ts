import {
  ItemDetailsRouteSchema,
  ItemSearchSchema,
  PropertyDetailsRouteSchema,
  PropertySearchSchema,
} from '@backend/api/wikibase/schemas'
import { databasePlugin } from '@backend/plugins/database'
import { errorHandlerPlugin } from '@backend/plugins/error-handler'
import { wikibasePlugin } from '@backend/plugins/wikibase'
import { ApiErrorHandler } from '@backend/types/error-handler'
import type { ItemId, PropertyId } from '@backend/types/wikibase-schema'
import { cors } from '@elysiajs/cors'
import { Elysia } from 'elysia'

export const wikibaseEntitiesApi = new Elysia({ prefix: '/api/wikibase/entities' })
  .use(cors())
  .use(databasePlugin)
  .use(errorHandlerPlugin)
  .use(wikibasePlugin)
  .get(
    '/properties/search',
    async ({
      query: {
        q,
        instance = 'wikidata',
        limit = 10,
        offset = 0,
        language = 'en',
        datatype,
        autocomplete = true,
      },
      wikibase,
    }) => {
      if (!q || q.trim().length === 0) {
        return ApiErrorHandler.validationError('Search query is required and cannot be empty')
      }

      const results = await wikibase.searchProperties(instance, q, {
        limit,
        offset,
        language,
        datatype,
        autocomplete,
      })
      return { data: results }
    },
    PropertySearchSchema,
  )
  .get(
    '/properties/:propertyId',
    async ({ params: { propertyId }, query: { instance = 'wikidata' }, wikibase }) => {
      if (!propertyId || !/^P\d+$/i.test(propertyId)) {
        return ApiErrorHandler.validationError(
          'Property ID must be in format P followed by numbers (e.g., P31)',
        )
      }

      const property = await wikibase.getProperty(instance, propertyId as PropertyId)
      if (!property) {
        return ApiErrorHandler.notFoundError(`Property ${propertyId} not found`)
      }
      return { data: property }
    },
    PropertyDetailsRouteSchema,
  )
  .get(
    '/items/search',
    async ({
      query: {
        q,
        instance = 'wikidata',
        limit = 10,
        offset = 0,
        language = 'en',
        autocomplete = true,
      },
      wikibase,
    }) => {
      if (!q || q.trim().length === 0) {
        return ApiErrorHandler.validationError('Search query is required and cannot be empty')
      }

      const results = await wikibase.searchItems(instance, q, {
        limit,
        offset,
        language,
        autocomplete,
      })
      return { data: results }
    },
    ItemSearchSchema,
  )
  .get(
    '/items/:itemId',
    async ({ params: { itemId }, query: { instance = 'wikidata' }, wikibase }) => {
      if (!itemId || !/^Q\d+$/i.test(itemId)) {
        return ApiErrorHandler.validationError(
          'Item ID must be in format Q followed by numbers (e.g., Q42)',
        )
      }

      const item = await wikibase.getItem(instance, itemId as ItemId)
      if (!item) {
        return ApiErrorHandler.notFoundError(`Item ${itemId} not found`)
      }
      return { data: item }
    },
    ItemDetailsRouteSchema,
  )
