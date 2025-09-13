import { ApiError } from '@backend/types/error-schemas'
import { ItemId, PropertyId, WikibaseDataType } from '@backend/types/wikibase-schema'
import { t } from 'elysia'

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

const Term = t.Union([t.Literal('label'), t.Literal('alias'), t.Literal('description')])
export type Term = typeof Term.static

const PropertySearchResultSchema = t.Object({
  id: t.String(),
  title: t.String(),
  pageid: t.Number(),
  datatype: WikibaseDataType,
  label: t.String(),
  description: t.String(),
  aliases: t.Array(t.String()),
  match: t.Object({
    type: Term,
    language: t.String(),
    text: t.String(),
  }),
})
export type PropertySearchResult = typeof PropertySearchResultSchema.static

export const PropertyDetailsSchema = t.Object({
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
})

export const ItemSearchResultSchema = t.Object({
  id: t.String(),
  label: t.String(),
  description: t.Optional(t.String()),
  match: t.Object({
    type: Term,
    text: t.String(),
  }),
})

export const SiteLinkSchema = t.Object({
  site: t.String(),
  title: t.String(),
  badges: t.Optional(t.Array(t.String())),
})

export const ItemDetailsSchema = t.Object({
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
})

// Response schemas
export const ItemSearchResponseSchema = t.Object({
  results: t.Array(ItemSearchResultSchema),
  totalCount: t.Number(),
  hasMore: t.Boolean(),
  query: t.String(),
})

export const InstanceId = t.String({
  default: 'wikidata',
  description: 'Wikibase instance ID',
})

// Route schemas
export const PropertySearchSchema = {
  query: t.Object({
    q: t.String({
      minLength: 1,
      description: 'Search query for properties',
    }),
    limit: t.Optional(
      t.Number({
        default: 10,
        description: 'Maximum number of results',
      }),
    ),
    offset: t.Optional(
      t.Number({
        default: 0,
        description: 'Offset for pagination',
      }),
    ),
    language: t.Optional(
      t.String({
        default: 'en',
        description: 'Language code for search results',
      }),
    ),
    languageFallback: t.Optional(
      t.Boolean({
        default: true,
        description: 'Enable language fallback for partial matches',
      }),
    ),
  }),
  response: {
    200: t.Object({
      data: t.Object({
        results: t.Array(PropertySearchResultSchema),
        totalCount: t.Number(),
        hasMore: t.Boolean(),
        query: t.String(),
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
    200: t.Object({ data: PropertyDetailsSchema }),
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
  params: t.Object({
    propertyId: PropertyId,
  }),
  response: {
    200: t.Object({
      data: t.Any(),
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
  body: t.Object({
    schema: t.Any({
      description: 'Schema object to validate',
    }),
    options: t.Optional(
      t.Object({
        strictMode: t.Optional(
          t.Boolean({
            default: false,
          }),
        ),
        includeWarnings: t.Optional(
          t.Boolean({
            default: true,
          }),
        ),
        validateReferences: t.Optional(
          t.Boolean({
            default: false,
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
  response: InstancePropertyDetailsSchema.response,
  detail: InstancePropertyDetailsSchema.detail,
}

export const ItemSearchSchema = {
  query: t.Object({
    q: t.String({
      description: 'Search query for items',
    }),
    limit: t.Optional(
      t.Number({
        default: 10,
        description: 'Maximum number of results',
      }),
    ),
    offset: t.Optional(
      t.Number({
        default: 0,
        description: 'Offset for pagination',
      }),
    ),
    language: t.Optional(
      t.String({
        default: 'en',
        description: 'Language code for search results',
      }),
    ),
    languageFallback: t.Optional(
      t.Boolean({
        default: true,
        description: 'Enable language fallback',
      }),
    ),
  }),
  response: {
    200: t.Object({ data: ItemSearchResponseSchema }),
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
  params: t.Object({
    itemId: ItemId,
  }),
  response: {
    200: t.Object({ data: ItemDetailsSchema }),
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
export const PropertyConstraintSchema = t.Object({
  type: t.String(),
  parameters: t.Record(t.String(), t.Any()),
  description: t.Optional(t.String()),
  violationMessage: t.Optional(t.String()),
})

export const ConstraintViolationSchema = t.Object({
  constraintType: t.String(),
  message: t.String(),
  severity: t.Union([t.Literal('error'), t.Literal('warning')]),
  propertyId: t.String(),
  value: t.Optional(t.Any()),
})

export const ConstraintWarningSchema = t.Object({
  constraintType: t.String(),
  message: t.String(),
  propertyId: t.String(),
})

export const ValidationResultSchema = t.Object({
  isValid: t.Boolean(),
  violations: t.Array(ConstraintViolationSchema),
  warnings: t.Array(ConstraintWarningSchema),
  suggestions: t.Array(t.String()),
})

export const PropertyConstraintsResponseSchema = t.Array(PropertyConstraintSchema)

export const PropertyValidationRequestSchema = t.Object({
  propertyId: t.String(),
  values: t.Array(t.Any()),
})

export const SchemaValidationRequestSchema = t.Object({
  schema: t.Record(t.String(), t.Array(t.Any())),
})

// Property Constraints Route Schemas
export const PropertyConstraintsRouteSchema = {
  params: t.Object({
    propertyId: PropertyId,
  }),
  response: {
    200: t.Object({ data: PropertyConstraintsResponseSchema }),
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
  response: {
    200: t.Object({ data: ValidationResultSchema }),
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
  response: {
    200: t.Object({ data: ValidationResultSchema }),
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
  response: {
    200: t.Object({ data: t.Object({ message: t.String() }) }),
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
    200: t.Object({
      data: t.Object({
        total: t.Number(),
        inserted: t.Number(),
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
