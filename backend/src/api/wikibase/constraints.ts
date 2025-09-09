import {
  CacheClearRouteSchema,
  PropertyConstraintsRouteSchema,
  PropertyValidationConstraintsRouteSchema,
  SchemaValidationConstraintsRouteSchema,
} from '@backend/api/wikibase/schemas'
import { errorHandlerPlugin } from '@backend/plugins/error-handler'
import { constraintValidationService } from '@backend/services/constraint-validation.service'
import type { PropertyId } from '@backend/types/wikibase-schema'
import { cors } from '@elysiajs/cors'
import { Elysia } from 'elysia'

export const wikibaseConstraintsApi = new Elysia({ prefix: '/api/wikibase/constraints' })
  .use(cors())
  .use(errorHandlerPlugin)

  // Get property constraints
  .get(
    '/properties/:propertyId',
    async ({ params: { propertyId }, query: { instance = 'wikidata' } }) => {
      const result = await constraintValidationService.getPropertyConstraints(
        instance,
        propertyId as PropertyId,
      )
      return { data: result }
    },
    PropertyConstraintsRouteSchema,
  )

  // Validate property values against constraints
  .post(
    '/validate/property',
    async ({ query: { instance = 'wikidata' }, body: { propertyId, values } }) => {
      const result = await constraintValidationService.validateProperty(
        instance,
        propertyId as PropertyId,
        values,
      )
      return { data: result }
    },
    PropertyValidationConstraintsRouteSchema,
  )

  // Validate entire schema against constraints
  .post(
    '/validate/schema',
    async ({ query: { instance = 'wikidata' }, body: { schema } }) => {
      const result = await constraintValidationService.validateSchema(instance, schema)
      return { data: result }
    },
    SchemaValidationConstraintsRouteSchema,
  )

  // Clear constraint cache
  .delete(
    '/cache',
    async ({ query: { instance = 'wikidata' } }) => {
      constraintValidationService.clearCache(instance)
      return { data: { message: 'Cache cleared successfully' } }
    },
    CacheClearRouteSchema,
  )
