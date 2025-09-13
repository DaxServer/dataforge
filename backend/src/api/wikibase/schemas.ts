import { ApiError } from '@backend/types/error-schemas'
import { ItemId, PropertyId, WikibaseDataType } from '@backend/types/wikibase-schema'
import z from 'zod'

// interface WikibaseSearchEntityResult<T> {
//   id: T
//   title: string
//   pageid: number
//   datatype: WikibaseDataType
//   concepturi: string
//   repository: string
//   url: string
//   display: {
//     label?: {
//       value: string
//       language: string
//     }
//     description?: {
//       value: string
//       language: string
//     }
//   }
//   label: string
//   description: string
//   match: {
//     type: string
//     language: string
//     text: string
//   }
//   aliases?: string[]
// }

const Term = z.union([z.literal('label'), z.literal('alias'), z.literal('description')])
export type Term = z.infer<typeof Term>

const PropertySearchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  pageid: z.number(),
  datatype: WikibaseDataType,
  label: z.string(),
  description: z.string(),
  aliases: z.array(z.string()),
  match: z.object({
    type: Term,
    language: z.string(),
    text: z.string(),
  }),
})
export type PropertySearchResult = z.infer<typeof PropertySearchResultSchema>

export const PropertyDetailsSchema = z.object({
  id: z.string(),
  pageid: z.number().optional(),
  ns: z.number().optional(),
  title: z.string().optional(),
  lastrevid: z.number().optional(),
  modified: z.string().optional(),
  type: z.literal('property'),
  datatype: WikibaseDataType,
  labels: z.record(z.string(), z.string()).optional(),
  descriptions: z.record(z.string(), z.string()).optional(),
  aliases: z.record(z.string(), z.array(z.string())).optional(),
  claims: z.record(z.string(), z.array(z.any())).optional(),
})

export const ItemSearchResultSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  match: z.object({
    type: Term,
    text: z.string(),
  }),
})

export const SiteLinkSchema = z.object({
  site: z.string(),
  title: z.string(),
  badges: z.optional(z.array(z.string())),
})

export const ItemDetailsSchema = z.object({
  id: z.string(),
  pageid: z.number().optional(),
  ns: z.number().optional(),
  title: z.string().optional(),
  lastrevid: z.number().optional(),
  modified: z.string().optional(),
  type: z.literal('item'),
  labels: z.record(z.string(), z.string()).optional(),
  descriptions: z.record(z.string(), z.string()).optional(),
  aliases: z.record(z.string(), z.array(z.string())).optional(),
  claims: z.record(z.string(), z.array(z.any())).optional(),
  sitelinks: z.record(z.string(), z.any()).optional(),
})

// Response schemas
export const ItemSearchResponseSchema = z.object({
  results: z.array(ItemSearchResultSchema),
  totalCount: z.number(),
  hasMore: z.boolean(),
  query: z.string(),
})

const InstanceId = z.string().describe('Wikibase instance ID').default('wikidata')

// Route schemas
export const PropertySearchSchema = {
  query: z.object({
    q: z.string().min(1).describe('Search query for properties'),
    instance: InstanceId,
    limit: z.coerce.number().default(10).describe('Maximum number of results'),
    offset: z.coerce.number().default(0).describe('Offset for pagination'),
    language: z.string().default('en').describe('Language code for search results'),
    languageFallback: z
      .boolean()
      .default(true)
      .describe('Enable language fallback for partial matches')
      .optional(),
  }),
  response: {
    200: z.object({
      data: z.object({
        results: z.array(PropertySearchResultSchema),
        totalCount: z.number(),
        hasMore: z.boolean(),
        query: z.string(),
      }),
    }),
    400: ApiError,
    422: ApiError,
    500: ApiError,
  },
  detail: {
    summary: 'Search Wikibase properties',
    description:
      'Search for properties in a Wikibase instance with enhanced filtering and language fallback support',
    tags: ['Wikibase', 'Properties', 'Search'],
  },
}

// Instance-specific schemas for the new API structure
export const InstancePropertyDetailsSchema = {
  params: z.object({
    instanceId: InstanceId,
    propertyId: PropertyId,
  }),
  query: z.object({
    includeConstraints: z
      .boolean()
      .default(false)
      .describe('Include property constraints in response')
      .optional(),
  }),
  response: {
    200: z.object({ data: PropertyDetailsSchema }),
    400: ApiError,
    404: ApiError,
    422: ApiError,
    500: ApiError,
  },
  detail: {
    summary: 'Get property details',
    description:
      'Retrieve detailed information about a specific property with optional constraint information',
    tags: ['Wikibase', 'Properties'],
  },
}

export const InstancePropertyConstraintsSchema = {
  params: z.object({
    instanceId: InstanceId,
    propertyId: PropertyId,
  }),
  response: {
    200: z.object({
      data: z.any(),
    }),
    400: ApiError,
    404: ApiError,
    500: ApiError,
  },
  detail: {
    summary: 'Get property constraints',
    description: 'Retrieve all constraints for a specific property',
    tags: ['Wikibase', 'Properties', 'Constraints'],
  },
}

export const PropertyValidationSchema = {
  params: z.object({
    instanceId: InstanceId,
  }),
  body: z
    .object({
      propertyId: PropertyId,
      value: z.any().describe('Value to validate against property constraints'),
      context: z.object({
        entityId: z.string().describe('Entity ID for context').optional(),
        additionalProperties: z
          .array(
            z.object({
              property: z.string(),
              value: z.any(),
            }),
          )
          .describe('Additional properties for validation context')
          .optional(),
      }),
    })
    .optional(),
  response: {
    200: z.object({
      data: z.object({
        isValid: z.boolean(),
        violations: z.array(
          z.object({
            constraintType: z.string(),
            message: z.string(),
            severity: z.union([z.literal('error'), z.literal('warning')]),
            propertyId: z.string(),
            value: z.optional(z.any()),
          }),
        ),
        warnings: z.array(
          z.object({
            constraintType: z.string(),
            message: z.string(),
            propertyId: z.string(),
            value: z.optional(z.any()),
          }),
        ),
        suggestions: z.array(z.string()),
      }),
    }),
    400: ApiError,
    500: ApiError,
  },
  detail: {
    summary: 'Validate property value',
    description: 'Validate a property value against its constraints in real-time',
    tags: ['Wikibase', 'Properties', 'Validation'],
  },
}

export const SchemaValidationSchema = {
  params: z.object({
    instanceId: InstanceId,
  }),
  body: z.object({
    schema: z.any().describe('Schema object to validate'),
    options: z
      .object({
        strictMode: z.boolean().default(false).describe('Enable strict validation mode').optional(),
        includeWarnings: z
          .boolean()
          .default(true)
          .describe('Include warnings in validation results')
          .optional(),
        validateReferences: z
          .boolean()
          .default(false)
          .describe('Validate referenced entities')
          .optional(),
      })
      .optional(),
  }),
  response: {
    200: z.object({
      data: z.object({
        isValid: z.boolean(),
        violations: z.array(
          z.object({
            constraintType: z.string(),
            message: z.string(),
            severity: z.union([z.literal('error'), z.literal('warning')]),
            propertyId: z.string(),
            value: z.optional(z.any()),
          }),
        ),
        warnings: z.array(
          z.object({
            constraintType: z.string(),
            message: z.string(),
            propertyId: z.string(),
            value: z.optional(z.any()),
          }),
        ),
        suggestions: z.array(z.string()),
      }),
    }),
    400: ApiError,
    500: ApiError,
  },
  detail: {
    summary: 'Validate schema',
    description: 'Validate a complete schema against Wikibase constraints and rules',
    tags: ['Wikibase', 'Schema', 'Validation'],
  },
}

export const PropertyDetailsRouteSchema = {
  params: z.object({
    propertyId: PropertyId,
  }),
  query: z.object({
    instance: InstanceId.optional(),
    includeConstraints: z
      .boolean()
      .default(false)
      .describe('Include property constraints in response')
      .optional(),
  }),
  response: InstancePropertyDetailsSchema.response,
  detail: InstancePropertyDetailsSchema.detail,
}

export const ItemSearchSchema = {
  query: z.object({
    q: z.string().describe('Search query for items'),
    instance: InstanceId.optional(),
    limit: z.number().default(10).describe('Maximum number of results').optional(),
    offset: z.number().default(0).describe('Offset for pagination').optional(),
    language: z.string().default('en').describe('Language code for search results').optional(),
    languageFallback: z.boolean().default(true).describe('Enable language fallback').optional(),
  }),
  response: {
    200: z.object({ data: ItemSearchResponseSchema }),
    400: ApiError,
    422: ApiError,
    500: ApiError,
  },
  detail: {
    summary: 'Search Wikibase items',
    description:
      'Search for items in a Wikibase instance with enhanced filtering and language fallback support',
    tags: ['Wikibase', 'Items', 'Search'],
  },
}

export const ItemDetailsRouteSchema = {
  params: z.object({
    instanceId: InstanceId,
    itemId: ItemId,
  }),
  response: {
    200: z.object({ data: ItemDetailsSchema }),
    400: ApiError,
    404: ApiError,
    422: ApiError,
    500: ApiError,
  },
  detail: {
    summary: 'Get item details',
    description: 'Retrieve detailed information about a specific item',
    tags: ['Wikibase', 'Items'],
  },
}

// Constraint-related schemas extracted from constraints.ts
export const PropertyConstraintSchema = z.object({
  type: z.string(),
  parameters: z.record(z.string(), z.any()),
  description: z.string().optional(),
  violationMessage: z.string().optional(),
})

export const ConstraintViolationSchema = z.object({
  constraintType: z.string(),
  message: z.string(),
  severity: z.union([z.literal('error'), z.literal('warning')]),
  propertyId: z.string(),
  value: z.optional(z.any()),
})

export const ConstraintWarningSchema = z.object({
  constraintType: z.string(),
  message: z.string(),
  propertyId: z.string(),
})

export const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  violations: z.array(ConstraintViolationSchema),
  warnings: z.array(ConstraintWarningSchema),
  suggestions: z.array(z.string()),
})

export const PropertyConstraintsResponseSchema = z.array(PropertyConstraintSchema)

export const PropertyValidationRequestSchema = z.object({
  propertyId: z.string(),
  values: z.array(z.any()),
})

export const SchemaValidationRequestSchema = z.object({
  schema: z.record(z.string(), z.array(z.any())),
})

// Property Constraints Route Schemas
export const PropertyConstraintsRouteSchema = {
  params: z.object({
    propertyId: z.string().describe('Property ID'),
  }),
  query: z.object({
    instance: InstanceId.optional(),
  }),
  response: {
    200: z.object({ data: PropertyConstraintsResponseSchema }),
    400: ApiError,
    404: ApiError,
    500: ApiError,
  },
  detail: {
    summary: 'Get property constraints',
    description: 'Retrieve all constraints defined for a specific property',
    tags: ['Wikibase', 'Constraints'],
  },
}

// Property Validation Route Schemas
export const PropertyValidationConstraintsRouteSchema = {
  body: PropertyValidationRequestSchema,
  query: z.object({
    instance: InstanceId.optional(),
  }),
  response: {
    200: z.object({ data: ValidationResultSchema }),
    400: ApiError,
    500: ApiError,
  },
  detail: {
    summary: 'Validate property values',
    description: 'Validate property values against their defined constraints',
    tags: ['Wikibase', 'Constraints', 'Validation'],
  },
}

// Schema Validation Route Schemas
export const SchemaValidationConstraintsRouteSchema = {
  body: SchemaValidationRequestSchema,
  query: z.object({
    instance: InstanceId.optional(),
  }),
  response: {
    200: z.object({ data: ValidationResultSchema }),
    400: ApiError,
    500: ApiError,
  },
  detail: {
    summary: 'Validate schema',
    description:
      'Validate an entire schema (multiple properties and their values) against constraints',
    tags: ['Wikibase', 'Constraints', 'Validation'],
  },
}

// Cache Clear Route Schemas
export const CacheClearRouteSchema = {
  query: z.object({
    instance: InstanceId.optional(),
  }),
  response: {
    200: z.object({ data: z.object({ message: z.string() }) }),
    500: ApiError,
  },
  detail: {
    summary: 'Clear constraint cache',
    description: 'Clear the constraint validation cache for better performance',
    tags: ['Wikibase', 'Constraints', 'Cache'],
  },
}

export const WikibasePropertiesFetchSchema = {
  response: {
    200: z.object({
      data: z.object({
        total: z.number(),
        inserted: z.number(),
      }),
    }),
    400: ApiError,
    500: ApiError,
  },
  detail: {
    summary: 'Fetch all properties',
    description: 'Fetch all properties from a Wikibase instance',
    tags: ['Wikibase', 'Properties'],
  },
}
