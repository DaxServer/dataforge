import { errorHandlerPlugin } from '@backend/plugins/error-handler'
import { constraintValidationService } from '@backend/services/constraint-validation.service'
import { ApiError } from '@backend/types/error-schemas'
import { cors } from '@elysiajs/cors'
import { Elysia, t } from 'elysia'
import type { PropertyId } from 'wikibase-sdk'

const PropertyConstraint = t.Object({
  type: t.String(),
  parameters: t.Record(t.String(), t.Any()),
  description: t.Optional(t.String()),
  violationMessage: t.Optional(t.String()),
})

const ConstraintViolation = t.Object({
  constraintType: t.String(),
  message: t.String(),
  severity: t.Union([t.Literal('error'), t.Literal('warning')]),
  propertyId: t.String(),
  value: t.Optional(t.Any()),
})

const ConstraintWarning = t.Object({
  constraintType: t.String(),
  message: t.String(),
  propertyId: t.String(),
})

const ValidationResult = t.Object({
  isValid: t.Boolean(),
  violations: t.Array(ConstraintViolation),
  warnings: t.Array(ConstraintWarning),
  suggestions: t.Array(t.String()),
})

const PropertyConstraintsResponse = t.Array(PropertyConstraint)

const PropertyValidationRequest = t.Object({
  propertyId: t.String(),
  values: t.Array(t.Any()),
})

const SchemaValidationRequest = t.Object({
  schema: t.Record(t.String(), t.Array(t.Any())),
})

export const wikibaseConstraintsApi = new Elysia({ prefix: '/api/wikibase/constraints' })
  .use(cors())
  .use(errorHandlerPlugin)

  // Get property constraints
  .get(
    '/properties/:propertyId',
    async ({ params: { propertyId }, query: { instance = 'wikidata' } }) => {
      const constraints = await constraintValidationService.getPropertyConstraints(
        instance,
        propertyId as PropertyId,
      )
      return { data: constraints }
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
        200: t.Object({ data: PropertyConstraintsResponse }),
        400: ApiError,
        404: ApiError,
        500: ApiError,
      },
      detail: {
        summary: 'Get property constraints',
        description: 'Retrieve all constraints defined for a specific property',
        tags: ['Wikibase', 'Constraints'],
      },
    },
  )

  // Validate property values against constraints
  .post(
    '/validate/property',
    async (context) => {
      const { propertyId, values } = context.body
      const instance = context.query.instance || 'wikidata'
      const result = await constraintValidationService.validateProperty(
        instance,
        propertyId as PropertyId,
        values,
      )
      return { data: result }
    },
    {
      body: PropertyValidationRequest,
      query: t.Object({
        instance: t.Optional(
          t.String({ description: 'Wikibase instance ID', default: 'wikidata' }),
        ),
      }),
      response: {
        200: t.Object({ data: ValidationResult }),
        400: ApiError,
        500: ApiError,
      },
      detail: {
        summary: 'Validate property values',
        description: 'Validate property values against their defined constraints',
        tags: ['Wikibase', 'Constraints', 'Validation'],
      },
    },
  )

  // Validate entire schema against constraints
  .post(
    '/validate/schema',
    async (context) => {
      const { schema } = context.body
      const instance = context.query.instance || 'wikidata'
      const result = await constraintValidationService.validateSchema(instance, schema)
      return { data: result }
    },
    {
      body: SchemaValidationRequest,
      query: t.Object({
        instance: t.Optional(
          t.String({ description: 'Wikibase instance ID', default: 'wikidata' }),
        ),
      }),
      response: {
        200: t.Object({ data: ValidationResult }),
        400: ApiError,
        500: ApiError,
      },
      detail: {
        summary: 'Validate schema',
        description:
          'Validate an entire schema (multiple properties and their values) against constraints',
        tags: ['Wikibase', 'Constraints', 'Validation'],
      },
    },
  )

  // Clear constraint cache
  .delete(
    '/cache',
    async (context) => {
      const instance = context.query.instance
      constraintValidationService.clearCache(instance)
      return { data: { message: 'Cache cleared successfully' } }
    },
    {
      query: t.Object({
        instance: t.Optional(
          t.String({
            description:
              'Wikibase instance ID to clear cache for (optional - clears all if not provided)',
          }),
        ),
      }),
      response: {
        200: t.Object({ data: t.Object({ message: t.String() }) }),
        500: ApiError,
      },
      detail: {
        summary: 'Clear constraint cache',
        description: 'Clear the constraint validation cache for better performance',
        tags: ['Wikibase', 'Constraints', 'Cache'],
      },
    },
  )
