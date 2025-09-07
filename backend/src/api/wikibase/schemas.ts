import { ApiError } from '@backend/types/error-schemas'
import { ItemId, PropertyId } from '@backend/types/wikibase-schema'
import { t } from 'elysia'

// Base schemas for Wikibase entities
export const PropertySearchResultSchema = t.Object({
  id: t.String(),
  label: t.String(),
  description: t.Optional(t.String()),
  datatype: t.String(),
  match: t.Object({
    type: t.Union([t.Literal('label'), t.Literal('alias'), t.Literal('description')]),
    text: t.String(),
  }),
})

export const PropertyDetailsSchema = t.Object({
  id: PropertyId,
  pageid: t.Optional(t.Number()),
  ns: t.Optional(t.Number()),
  title: t.Optional(t.String()),
  lastrevid: t.Optional(t.Number()),
  modified: t.Optional(t.String()),
  type: t.Literal('property'),
  datatype: t.String(),
  labels: t.Optional(t.Object({})),
  descriptions: t.Optional(t.Object({})),
  aliases: t.Optional(t.Object({})),
  claims: t.Optional(t.Object({})),
})

export const ItemSearchResultSchema = t.Object({
  id: t.String(),
  label: t.String(),
  description: t.Optional(t.String()),
  match: t.Object({
    type: t.Union([t.Literal('label'), t.Literal('alias'), t.Literal('description')]),
    text: t.String(),
  }),
})

export const SiteLinkSchema = t.Object({
  site: t.String(),
  title: t.String(),
  badges: t.Optional(t.Array(t.String())),
})

export const ItemDetailsSchema = t.Object({
  id: ItemId,
  pageid: t.Optional(t.Number()),
  ns: t.Optional(t.Number()),
  title: t.Optional(t.String()),
  lastrevid: t.Optional(t.Number()),
  modified: t.Optional(t.String()),
  type: t.Literal('item'),
  labels: t.Optional(t.Object({})),
  descriptions: t.Optional(t.Object({})),
  aliases: t.Optional(t.Object({})),
  claims: t.Optional(t.Object({})),
  sitelinks: t.Optional(t.Object({})),
})

// Response schemas
export const PropertySearchResponseSchema = t.Object({
  results: t.Array(PropertySearchResultSchema),
  totalCount: t.Number(),
  hasMore: t.Boolean(),
  query: t.String(),
})

export const ItemSearchResponseSchema = t.Object({
  results: t.Array(ItemSearchResultSchema),
  totalCount: t.Number(),
  hasMore: t.Boolean(),
  query: t.String(),
})

// Route schemas
export const PropertySearchSchema = {
  query: t.Object({
    q: t.String({ description: 'Search query for properties' }),
    instance: t.Optional(t.String({ description: 'Wikibase instance ID', default: 'wikidata' })),
    limit: t.Optional(t.Number({ description: 'Maximum number of results', default: 10 })),
    offset: t.Optional(t.Number({ description: 'Offset for pagination', default: 0 })),
    language: t.Optional(
      t.String({ description: 'Language code for search results', default: 'en' }),
    ),
    datatype: t.Optional(
      t.String({
        description: 'Filter by property data type (e.g., wikibase-item, string, time)',
      }),
    ),
    autocomplete: t.Optional(
      t.Boolean({ description: 'Enable autocomplete mode for faster results', default: true }),
    ),
  }),
  response: {
    200: t.Object({ data: PropertySearchResponseSchema }),
    400: ApiError,
    422: ApiError,
    500: ApiError,
  },
  detail: {
    summary: 'Search Wikibase properties',
    description:
      'Search for properties in a Wikibase instance with enhanced filtering and autocomplete support',
    tags: ['Wikibase', 'Properties', 'Search'],
  },
}

// Instance-specific schemas for the new API structure
export const InstancePropertyDetailsSchema = {
  params: t.Object({
    instanceId: t.String({ description: 'Wikibase instance ID' }),
    propertyId: PropertyId,
  }),
  query: t.Object({
    includeConstraints: t.Optional(
      t.Boolean({ description: 'Include property constraints in response', default: false }),
    ),
    language: t.Optional(
      t.String({ description: 'Language code for labels and descriptions', default: 'en' }),
    ),
  }),
  response: {
    200: t.Object({ data: PropertyDetailsSchema }),
    400: ApiError,
    404: ApiError,
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
    instanceId: t.String({ description: 'Wikibase instance ID' }),
    propertyId: PropertyId,
  }),
  response: {
    200: t.Object({
      data: t.Array(
        t.Object({
          type: t.String(),
          parameters: t.Object({}),
          description: t.Optional(t.String()),
          violationMessage: t.Optional(t.String()),
        }),
      ),
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
    instanceId: t.String({ description: 'Wikibase instance ID' }),
  }),
  body: t.Object({
    propertyId: PropertyId,
    value: t.Any({ description: 'Value to validate against property constraints' }),
    context: t.Optional(
      t.Object({
        entityId: t.Optional(t.String({ description: 'Entity ID for context' })),
        additionalProperties: t.Optional(
          t.Array(
            t.Object({
              property: t.String(),
              value: t.Any(),
            }),
            { description: 'Additional properties for validation context' },
          ),
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
    summary: 'Validate property value',
    description: 'Validate a property value against its constraints in real-time',
    tags: ['Wikibase', 'Properties', 'Validation'],
  },
}

export const SchemaValidationSchema = {
  params: t.Object({
    instanceId: t.String({ description: 'Wikibase instance ID' }),
  }),
  body: t.Object({
    schema: t.Any({ description: 'Schema object to validate' }),
    options: t.Optional(
      t.Object({
        strictMode: t.Optional(
          t.Boolean({ description: 'Enable strict validation mode', default: false }),
        ),
        includeWarnings: t.Optional(
          t.Boolean({ description: 'Include warnings in validation results', default: true }),
        ),
        validateReferences: t.Optional(
          t.Boolean({ description: 'Validate referenced entities', default: false }),
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
    instance: t.Optional(t.String({ description: 'Wikibase instance ID', default: 'wikidata' })),
    includeConstraints: t.Optional(
      t.Boolean({ description: 'Include property constraints in response', default: false }),
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

export const ItemSearchSchema = {
  query: t.Object({
    q: t.String({ description: 'Search query for items' }),
    instance: t.Optional(t.String({ description: 'Wikibase instance ID', default: 'wikidata' })),
    limit: t.Optional(t.Number({ description: 'Maximum number of results', default: 10 })),
    offset: t.Optional(t.Number({ description: 'Offset for pagination', default: 0 })),
    language: t.Optional(
      t.String({ description: 'Language code for search results', default: 'en' }),
    ),
    autocomplete: t.Optional(
      t.Boolean({ description: 'Enable autocomplete mode for faster results', default: true }),
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
      'Search for items in a Wikibase instance with enhanced filtering and autocomplete support',
    tags: ['Wikibase', 'Items', 'Search'],
  },
}

export const ItemDetailsRouteSchema = {
  params: t.Object({
    itemId: ItemId,
  }),
  query: t.Object({
    instance: t.Optional(t.String({ description: 'Wikibase instance ID', default: 'wikidata' })),
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
