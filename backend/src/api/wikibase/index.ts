import {
  InstanceId,
  PropertySearchResultSchema,
  QuerySchema,
  Term,
} from '@backend/api/wikibase/schemas'
import { databasePlugin } from '@backend/plugins/database'
import { errorHandlerPlugin } from '@backend/plugins/error-handler'
import { wikibasePlugin } from '@backend/plugins/wikibase'
import { constraintValidationService } from '@backend/services/constraint-validation.service'
import { ApiErrorHandler } from '@backend/types/error-handler'
import { ApiErrors } from '@backend/types/error-schemas'
import { PropertyId, WikibaseDataType, ItemId } from '@backend/types/wikibase-schema'
import { cors } from '@elysiajs/cors'
import { Elysia, t } from 'elysia'

export const wikibaseEntitiesApi = new Elysia({ prefix: '/api/wikibase' })
  .use(cors())
  .use(databasePlugin)
  .use(errorHandlerPlugin)
  .use(wikibasePlugin)

  .guard({
    schema: 'standalone',
    params: t.Object({
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
    {
      response: {
        200: t.Object({
          data: t.Object({
            total: t.Number(),
            inserted: t.Number(),
          }),
        }),
        400: ApiErrors,
        500: ApiErrors,
      },
      detail: {
        summary: 'Fetch all properties',
        description: 'Fetch all properties from a Wikibase instance',
        tags: ['Wikibase', 'Properties'],
      },
    },
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
    {
      query: QuerySchema,
      response: {
        200: t.Object({
          data: t.Object({
            results: t.Array(PropertySearchResultSchema),
            totalCount: t.Number(),
            hasMore: t.Boolean(),
            query: t.String(),
          }),
        }),
        400: ApiErrors,
        422: ApiErrors,
        500: ApiErrors,
      },
      detail: {
        summary: 'Search Wikibase properties',
        description:
          'Search for properties in a Wikibase instance with enhanced filtering and language fallback support',
        tags: ['Wikibase', 'Properties', 'Search'],
      },
    },
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
    {
      params: t.Object({
        propertyId: PropertyId,
      }),
      query: t.Object({
        includeConstraints: t.Optional(
          t.Boolean({
            default: false,
            description: 'Include property constraints in response',
          }),
        ),
      }),
      response: {
        200: t.Object({
          data: t.Object({
            id: t.String(),
            pageid: t.Optional(t.Number()),
            ns: t.Optional(t.Number()),
            title: t.Optional(t.String()),
            lastrevid: t.Optional(t.Number()),
            modified: t.Optional(t.String()),
            type: t.Literal('property'),
            datatype: WikibaseDataType,
            labels: t.Optional(t.Record(t.String(), t.String())),
            descriptions: t.Optional(t.Record(t.String(), t.String())),
            aliases: t.Optional(t.Record(t.String(), t.Array(t.String()))),
            claims: t.Optional(t.Record(t.String(), t.Array(t.Any()))),
          }),
        }),
        400: ApiErrors,
        404: ApiErrors,
        422: ApiErrors,
        500: ApiErrors,
      },
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
      const constraints = await constraintValidationService.getPropertyConstraints(
        instanceId,
        propertyId,
      )
      return { data: constraints }
    },
    {
      params: t.Object({
        propertyId: PropertyId,
      }),
      response: {
        200: t.Object({
          data: t.Any(),
        }),
        400: ApiErrors,
        404: ApiErrors,
        500: ApiErrors,
      },
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
      const validationResult = await constraintValidationService.validateProperty(
        instanceId,
        propertyId,
        [value], // Convert single value to array as expected by the service
      )
      return { data: validationResult }
    },
    {
      params: t.Object({
        instanceId: InstanceId,
      }),
      body: t.Object({
        propertyId: PropertyId,
        value: t.Any({
          description: 'Value to validate against property constraints',
        }),
        context: t.Object({
          entityId: t.Optional(
            t.String({
              description: 'Entity ID for context',
            }),
          ),
          additionalProperties: t.Optional(
            t.Array(
              t.Object({
                property: t.String(),
                value: t.Any(),
              }),
            ),
          ),
        }),
      }),
      response: {
        200: t.Object({
          data: t.Object({
            isValid: t.Boolean(),
            violations: t.Array(
              t.Object({
                constraintType: t.String(),
                message: t.String(),
                severity: t.Union([t.Literal('error'), t.Literal('warning')]),
                propertyId: t.String(),
                value: t.Optional(t.Any()),
              }),
            ),
            warnings: t.Array(
              t.Object({
                constraintType: t.String(),
                message: t.String(),
                propertyId: t.String(),
                value: t.Optional(t.Any()),
              }),
            ),
            suggestions: t.Array(t.String()),
          }),
        }),
        400: ApiErrors,
        500: ApiErrors,
      },
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
      body: t.Object({
        schema: t.Any({
          description: 'Schema object to validate',
        }),
        options: t.Optional(
          t.Object({
            strictMode: t.Optional(
              t.Boolean({
                default: false,
                description: 'Enable strict validation mode',
              }),
            ),
            includeWarnings: t.Optional(
              t.Boolean({
                default: true,
                description: 'Include warnings in validation results',
              }),
            ),
            validateReferences: t.Optional(
              t.Boolean({
                default: false,
                description: 'Validate referenced entities',
              }),
            ),
          }),
        ),
      }),
      response: {
        200: t.Object({
          data: t.Object({
            isValid: t.Boolean(),
            violations: t.Array(
              t.Object({
                constraintType: t.String(),
                message: t.String(),
                severity: t.Union([t.Literal('error'), t.Literal('warning')]),
                propertyId: t.String(),
                value: t.Optional(t.Any()),
              }),
            ),
            warnings: t.Array(
              t.Object({
                constraintType: t.String(),
                message: t.String(),
                propertyId: t.String(),
                value: t.Optional(t.Any()),
              }),
            ),
            suggestions: t.Array(t.String()),
          }),
        }),
        400: ApiErrors,
        500: ApiErrors,
      },
      detail: {
        summary: 'Validate schema',
        description: 'Validate a complete schema against Wikibase constraints and rules',
        tags: ['Wikibase', 'Schema', 'Validation'],
      },
    },
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
    {
      query: QuerySchema,
      response: {
        200: t.Object({
          data: t.Object({
            results: t.Array(
              t.Object({
                id: t.String(),
                label: t.String(),
                description: t.Optional(t.String()),
                match: t.Object({
                  type: Term,
                  text: t.String(),
                }),
              }),
            ),
            totalCount: t.Number(),
            hasMore: t.Boolean(),
            query: t.String(),
          }),
        }),
        400: ApiErrors,
        422: ApiErrors,
        500: ApiErrors,
      },
      detail: {
        summary: 'Search Wikibase items',
        description:
          'Search for items in a Wikibase instance with enhanced filtering and language fallback support',
        tags: ['Wikibase', 'Items', 'Search'],
      },
    },
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
    {
      params: t.Object({
        itemId: ItemId,
      }),
      response: {
        200: t.Object({
          data: t.Object({
            id: t.String(),
            pageid: t.Optional(t.Number()),
            ns: t.Optional(t.Number()),
            title: t.Optional(t.String()),
            lastrevid: t.Optional(t.Number()),
            modified: t.Optional(t.String()),
            type: t.Literal('item'),
            labels: t.Optional(t.Record(t.String(), t.String())),
            descriptions: t.Optional(t.Record(t.String(), t.String())),
            aliases: t.Optional(t.Record(t.String(), t.Array(t.String()))),
            claims: t.Optional(t.Record(t.String(), t.Array(t.Any()))),
            sitelinks: t.Optional(t.Record(t.String(), t.Any())),
          }),
        }),
        400: ApiErrors,
        404: ApiErrors,
        422: ApiErrors,
        500: ApiErrors,
      },
      detail: {
        summary: 'Get item details',
        description: 'Retrieve detailed information about a specific item',
        tags: ['Wikibase', 'Items'],
      },
    },
  )
