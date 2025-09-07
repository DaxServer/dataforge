import {
  InstancePropertyConstraintsSchema,
  InstancePropertyDetailsSchema,
  ItemDetailsRouteSchema,
  ItemSearchSchema,
  PropertySearchSchema,
  PropertyValidationSchema,
  SchemaValidationSchema,
} from '@backend/api/wikibase/schemas'
import { databasePlugin } from '@backend/plugins/database'
import { errorHandlerPlugin } from '@backend/plugins/error-handler'
import { wikibasePlugin } from '@backend/plugins/wikibase'
import { constraintValidationService } from '@backend/services/constraint-validation.service'
import { ApiErrorHandler } from '@backend/types/error-handler'
import type { ItemId, PropertyId } from '@backend/types/wikibase-schema'
import { cors } from '@elysiajs/cors'
import { Elysia, t } from 'elysia'

/**
 * Instance-specific Wikibase API routes following the pattern /api/wikibase/:instanceId/...
 * These routes use the NodemwWikibaseService with enhanced search parameters and constraint support
 */
export const wikibaseInstanceApi = new Elysia({ prefix: '/api/wikibase' })
  .use(cors())
  .use(databasePlugin)
  .use(errorHandlerPlugin)
  .use(wikibasePlugin)

  // Property search endpoint with enhanced filtering
  .get(
    '/:instanceId/properties/search',
    async ({
      params: { instanceId },
      query: {
        q,
        limit = 10,
        offset = 0,
        language = 'en',
        dataType,
        autocomplete = true,
        includeUsageStats = false,
        sortBy = 'relevance',
      },
      wikibase,
    }) => {
      if (!q || q.trim().length === 0) {
        return ApiErrorHandler.validationError('Search query is required and cannot be empty')
      }

      const results = await wikibase.searchProperties(instanceId, q, {
        limit,
        offset,
        language,
        datatype: dataType,
        autocomplete,
      })

      // Enhanced response formatting for frontend compatibility
      const enhancedResults = {
        ...results,
        results: results.results.map((property: any) => ({
          ...property,
          // Add relevance indicators
          relevanceScore: property.match?.type === 'label' ? 1.0 : 0.8,
          // Add usage statistics if requested
          ...(includeUsageStats && {
            usageStats: {
              statementCount: 0, // Would be populated from actual usage data
              lastUsed: null,
              popularity: 'unknown',
            },
          }),
        })),
        // Add search metadata
        searchMetadata: {
          query: q,
          language,
          datatype: dataType,
          sortBy,
          enhancedFiltering: true,
        },
      }

      return { data: enhancedResults }
    },
    {
      params: t.Object({
        instanceId: t.String({ description: 'Wikibase instance ID' }),
      }),
      query: t.Object({
        q: t.String({ description: 'Search query for properties' }),
        limit: t.Optional(t.Number({ description: 'Maximum number of results', default: 10 })),
        offset: t.Optional(t.Number({ description: 'Offset for pagination', default: 0 })),
        language: t.Optional(
          t.String({ description: 'Language code for search results', default: 'en' }),
        ),
        dataType: t.Optional(t.String({ description: 'Filter by property data type' })),
        autocomplete: t.Optional(
          t.Boolean({ description: 'Enable autocomplete mode', default: true }),
        ),
        includeUsageStats: t.Optional(
          t.Boolean({ description: 'Include property usage statistics', default: false }),
        ),
        sortBy: t.Optional(
          t.Union([t.Literal('relevance'), t.Literal('alphabetical'), t.Literal('usage')], {
            description: 'Sort results by criteria',
            default: 'relevance',
          }),
        ),
      }),
      response: PropertySearchSchema.response,
      detail: {
        summary: 'Search properties in Wikibase instance',
        description:
          'Search for properties in a specific Wikibase instance with enhanced filtering, usage statistics, and relevance indicators',
        tags: ['Wikibase', 'Properties', 'Search'],
      },
    },
  )

  // Property details endpoint with constraint information
  .get(
    '/:instanceId/properties/:propertyId',
    async ({
      params: { instanceId, propertyId },
      query: { includeConstraints = false },
      wikibase,
    }) => {
      if (!propertyId || !/^P\d+$/i.test(propertyId)) {
        return ApiErrorHandler.validationError(
          'Property ID must be in format P followed by numbers (e.g., P31)',
        )
      }

      const property = await wikibase.getProperty(instanceId, propertyId as PropertyId)
      if (!property) {
        return ApiErrorHandler.notFoundError(`Property ${propertyId} not found`)
      }

      // Add constraint information if requested
      if (includeConstraints) {
        const constraints = await constraintValidationService.getPropertyConstraints(
          instanceId,
          propertyId as PropertyId,
        )
        property.constraints = constraints
      }

      return { data: property }
    },
    {
      params: t.Object({
        instanceId: t.String({ description: 'Wikibase instance ID' }),
        propertyId: t.String({ description: 'Property ID (e.g., P31)' }),
      }),
      query: t.Object({
        includeConstraints: t.Optional(
          t.Boolean({ description: 'Include property constraints in response', default: false }),
        ),
        language: t.Optional(
          t.String({ description: 'Language code for labels and descriptions', default: 'en' }),
        ),
      }),
      response: InstancePropertyDetailsSchema.response,
      detail: {
        summary: 'Get property details',
        description:
          'Retrieve detailed information about a specific property with optional constraint information',
        tags: ['Wikibase', 'Properties'],
      },
    },
  )

  // Property constraints endpoint
  .get(
    '/:instanceId/properties/:propertyId/constraints',
    async ({ params: { instanceId, propertyId } }) => {
      if (!propertyId || !/^P\d+$/i.test(propertyId)) {
        return ApiErrorHandler.validationError(
          'Property ID must be in format P followed by numbers (e.g., P31)',
        )
      }

      const constraints = await constraintValidationService.getPropertyConstraints(
        instanceId,
        propertyId as PropertyId,
      )
      return { data: constraints }
    },
    {
      params: t.Object({
        instanceId: t.String({ description: 'Wikibase instance ID' }),
        propertyId: t.String({ description: 'Property ID (e.g., P31)' }),
      }),
      response: InstancePropertyConstraintsSchema.response,
      detail: {
        summary: 'Get property constraints',
        description: 'Retrieve all constraints for a specific property',
        tags: ['Wikibase', 'Properties', 'Constraints'],
      },
    },
  )

  // Real-time property validation endpoint
  .post(
    '/:instanceId/validate/property',
    async ({ params: { instanceId }, body: { propertyId, value } }) => {
      if (!propertyId || !/^P\d+$/i.test(propertyId)) {
        return ApiErrorHandler.validationError(
          'Property ID must be in format P followed by numbers (e.g., P31)',
        )
      }

      const validationResult = await constraintValidationService.validateProperty(
        instanceId,
        propertyId as PropertyId,
        [value], // Convert single value to array as expected by the service
      )
      return { data: validationResult }
    },
    {
      params: t.Object({
        instanceId: t.String({ description: 'Wikibase instance ID' }),
      }),
      body: PropertyValidationSchema.body,
      response: PropertyValidationSchema.response,
      detail: {
        summary: 'Validate property value',
        description: 'Validate a property value against its constraints in real-time',
        tags: ['Wikibase', 'Properties', 'Validation'],
      },
    },
  )

  // Schema validation endpoint
  .post(
    '/:instanceId/validate/schema',
    async ({ params: { instanceId }, body: { schema } }) => {
      const validationResult = await constraintValidationService.validateSchema(instanceId, schema)
      return { data: validationResult }
    },
    {
      params: t.Object({
        instanceId: t.String({ description: 'Wikibase instance ID' }),
      }),
      body: SchemaValidationSchema.body,
      response: SchemaValidationSchema.response,
      detail: {
        summary: 'Validate schema',
        description: 'Validate a complete schema against Wikibase constraints and rules',
        tags: ['Wikibase', 'Schema', 'Validation'],
      },
    },
  )

  // Item search endpoint (for completeness)
  .get(
    '/:instanceId/items/search',
    async ({
      params: { instanceId },
      query: { q, limit = 10, offset = 0, language = 'en', autocomplete = true },
      wikibase,
    }) => {
      if (!q || q.trim().length === 0) {
        return ApiErrorHandler.validationError('Search query is required and cannot be empty')
      }

      const results = await wikibase.searchItems(instanceId, q, {
        limit,
        offset,
        language,
        autocomplete,
      })
      return { data: results }
    },
    {
      params: t.Object({
        instanceId: t.String({ description: 'Wikibase instance ID' }),
      }),
      query: t.Object({
        q: t.String({ description: 'Search query for items' }),
        limit: t.Optional(t.Number({ description: 'Maximum number of results', default: 10 })),
        offset: t.Optional(t.Number({ description: 'Offset for pagination', default: 0 })),
        language: t.Optional(
          t.String({ description: 'Language code for search results', default: 'en' }),
        ),
        autocomplete: t.Optional(
          t.Boolean({ description: 'Enable autocomplete mode', default: true }),
        ),
      }),
      response: ItemSearchSchema.response,
      detail: {
        summary: 'Search items in Wikibase instance',
        description: 'Search for items in a specific Wikibase instance',
        tags: ['Wikibase', 'Items', 'Search'],
      },
    },
  )

  // Item details endpoint (for completeness)
  .get(
    '/:instanceId/items/:itemId',
    async ({ params: { instanceId, itemId }, wikibase }) => {
      if (!itemId || !/^Q\d+$/i.test(itemId)) {
        return ApiErrorHandler.validationError(
          'Item ID must be in format Q followed by numbers (e.g., Q42)',
        )
      }

      const item = await wikibase.getItem(instanceId, itemId as ItemId)
      if (!item) {
        return ApiErrorHandler.notFoundError(`Item ${itemId} not found`)
      }
      return { data: item }
    },
    {
      params: t.Object({
        instanceId: t.String({ description: 'Wikibase instance ID' }),
        itemId: t.String({ description: 'Item ID (e.g., Q42)' }),
      }),
      response: ItemDetailsRouteSchema.response,
      detail: {
        summary: 'Get item details',
        description: 'Retrieve detailed information about a specific item',
        tags: ['Wikibase', 'Items'],
      },
    },
  )
