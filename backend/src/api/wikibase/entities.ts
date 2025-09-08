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
    async ({ params: { propertyId }, query: { instance = 'wikidata' }, wikibase, status }) => {
      const property = await wikibase.getProperty(instance, propertyId)
      if (!property) {
        return status(404, ApiErrorHandler.notFoundError('Property', propertyId))
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
    async ({ params: { itemId }, query: { instance = 'wikidata' }, wikibase, status }) => {
      const item = await wikibase.getItem(instance, itemId)
      if (!item) {
        return status(404, ApiErrorHandler.notFoundError('Item', itemId))
      }
      return { data: item }
    },
    ItemDetailsRouteSchema,
  )
