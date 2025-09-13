import type {
  ItemId,
  PropertyId,
  StatementRank,
  WikibaseDataType,
} from '@backend/types/wikibase-schema'

// Define missing types that are referenced but not defined
export interface Property {
  id: string
  type: 'property'
  labels: Record<string, string>
  descriptions: Record<string, string>
  aliases: Record<string, string[]>
  datatype: WikibaseDataType
  claims: Record<string, Claim[]>
}

export interface Item {
  id: string
  type: 'item'
  labels: Record<string, string>
  descriptions: Record<string, string>
  aliases: Record<string, string[]>
  claims: Record<string, Claim[]>
  sitelinks?: Record<string, SiteLink>
}

export interface Claim {
  id: string
  mainsnak: Snak
  qualifiers?: Record<PropertyId, Snak[]>
  qualifiers_order?: PropertyId[]
  references?: Reference[]
  rank: StatementRank
  type: 'claim'
}

export interface Snak {
  snaktype: any
  property: PropertyId
  datavalue?: SnakDataValue
  datatype: WikibaseDataType
}

export interface SnakDataValue {
  value: any
  type: string
}

export interface Reference {
  hash: string
  snaks: Record<PropertyId, Snak[]>
  snaks_order: PropertyId[]
}

export interface SiteLink {
  site: string
  title: string
  badges?: ItemId[]
  url?: string
}

export interface WikibaseInstanceConfig {
  id: string
  name: string
  baseUrl: string
  userAgent: string
  authToken?: string
}

// Property Types - using proper Wikibase schema types
export interface PropertyDetails extends Omit<Property, 'id' | 'type'> {
  id: PropertyId
  type: 'property'
  labels: Record<string, string>
  descriptions: Record<string, string>
  aliases: Record<string, string[]>
  datatype: WikibaseDataType
  claims: Record<string, Claim[]>
  constraints?: PropertyConstraint[]
}

export interface PropertySearchResult {
  id: PropertyId
  label: string
  description?: string
  datatype: WikibaseDataType
  match: {
    type: 'label' | 'alias' | 'description'
    text: string
  }
}

export interface PropertyConstraint {
  type: string
  parameters: Record<string, SnakDataValue>
  description?: string
  violationMessage?: string
}

// Item Types - using proper Wikibase schema types
export interface ItemDetails extends Omit<Item, 'id' | 'type' | 'claims'> {
  id: ItemId
  type: 'item'
  claims: Record<PropertyId, Claim[]>
  sitelinks?: Record<string, SiteLink>
}

export interface ItemSearchResult {
  id: ItemId
  label: string
  description?: string
  match: {
    type: 'label' | 'alias' | 'description'
    text: string
  }
}

// Search and API Response Types
export interface SearchOptions {
  limit: number
  offset: number
  language: string
  languageFallback?: boolean
}

export interface SearchResponse<T> {
  results: T[]
  totalCount: number
  hasMore: boolean
  query: string
}

// Validation Types
export interface ValidationResult {
  isValid: boolean
  violations: ConstraintViolation[]
  warnings: ConstraintWarning[]
  suggestions: string[]
}

export interface ConstraintViolation {
  constraintType: string
  message: string
  severity: 'error' | 'warning'
  propertyId: string
  value?: SnakDataValue
}

export interface ConstraintWarning {
  constraintType: string
  message: string
  propertyId: string
  value?: SnakDataValue
}
