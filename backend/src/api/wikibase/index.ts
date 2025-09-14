import {
  InstanceId,
  InstancePropertyConstraintsSchema,
  InstancePropertyDetailsSchema,
  ItemDetailsRouteSchema,
  ItemSearchSchema,
  PropertySearchSchema,
  PropertyValidationSchema,
  SchemaValidationSchema,
  WikibasePropertiesFetchSchema,
} from '@backend/api/wikibase/schemas'
import { databasePlugin } from '@backend/plugins/database'
import { errorHandlerPlugin } from '@backend/plugins/error-handler'
import { wikibasePlugin } from '@backend/plugins/wikibase'
import { constraintValidationService } from '@backend/services/constraint-validation.service'
import { ApiErrorHandler } from '@backend/types/error-handler'
import { cors } from '@elysiajs/cors'
import { Elysia } from 'elysia'
import z from 'zod'

export const wikibaseEntitiesApi = new Elysia({ prefix: '/api/wikibase' })
  .use(cors())
  .use(databasePlugin)
  .use(errorHandlerPlugin)
  .use(wikibasePlugin)

  .guard({
    schema: 'standalone',
    params: z.object({
      instanceId: InstanceId,
    }),
  })

  .post(
    '/:instanceId/properties/fetch',
    async ({ params: { instanceId }, wikibase, db }) => {
      const { total, inserted } = await wikibase.fetchAllProperties(instanceId, db())

      return {
        data: {
          total,
          inserted,
        },
      }
    },
    WikibasePropertiesFetchSchema,
  )

  .get(
    '/:instanceId/properties/search',
    async ({
      params: { instanceId },
      query: { q, limit, offset, language, languageFallback },
      wikibase,
    }) => {
      if (q.trim().length === 0) {
        return ApiErrorHandler.validationError('Search query is required and cannot be empty')
      }

      const results = await wikibase.searchProperties(instanceId, q, {
        limit,
        offset,
        language,
        languageFallback,
      })

      return { data: results }
    },
    PropertySearchSchema,
  )

  .get(
    '/:instanceId/properties/:propertyId',
    async ({
      params: { instanceId, propertyId },
      query: { includeConstraints = false },
      wikibase,
      status,
    }) => {
      const property = await wikibase.getProperty(instanceId, propertyId)
      if (!property) {
        return status(404, ApiErrorHandler.notFoundError('Property', propertyId))
      }

      // Add constraint information if requested
      if (includeConstraints) {
        const constraints = await constraintValidationService.getPropertyConstraints(
          instanceId,
          propertyId,
        )
        property.constraints = constraints
      }

      return { data: property }
    },
    InstancePropertyDetailsSchema,
  )

  // Property constraints endpoint
  .get(
    '/:instanceId/properties/:propertyId/constraints',
    async ({ params: { instanceId, propertyId } }) => {
      const constraints = await constraintValidationService.getPropertyConstraints(
        instanceId,
        propertyId,
      )
      return { data: constraints }
    },
    InstancePropertyConstraintsSchema,
  )

  // Real-time property validation endpoint
  .post(
    '/:instanceId/validate/property',
    async ({ params: { instanceId }, body: { propertyId, value } }) => {
      const validationResult = await constraintValidationService.validateProperty(
        instanceId,
        propertyId,
        [value], // Convert single value to array as expected by the service
      )
      return { data: validationResult }
    },
    PropertyValidationSchema,
  )

  // Schema validation endpoint
  .post(
    '/:instanceId/validate/schema',
    async ({ params: { instanceId }, body: { schema } }) => {
      const validationResult = await constraintValidationService.validateSchema(instanceId, schema)
      return { data: validationResult }
    },
    SchemaValidationSchema,
  )

  .get(
    '/:instanceId/items/search',
    async ({
      params: { instanceId },
      query: { q, limit = 10, offset = 0, language = 'en', languageFallback },
      wikibase,
    }) => {
      if (!q || q.trim().length === 0) {
        return ApiErrorHandler.validationError('Search query is required and cannot be empty')
      }

      const results = await wikibase.searchItems(instanceId, q, {
        limit,
        offset,
        language,
        languageFallback,
      })

      return { data: results }
    },
    ItemSearchSchema,
  )

  .get(
    '/:instanceId/items/:itemId',
    async ({ params: { instanceId, itemId }, wikibase, status }) => {
      const item = await wikibase.getItem(instanceId, itemId)
      if (!item) {
        return status(404, ApiErrorHandler.notFoundError('Item', itemId))
      }
      return { data: item }
    },
    ItemDetailsRouteSchema,
  )
