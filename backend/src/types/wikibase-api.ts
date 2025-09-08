import type {
  Claim,
  Item,
  ItemId,
  Property,
  PropertyId,
  Sitelink,
  Snak,
  SnakDataValue,
} from '@backend/types/wikibase-schema'

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
  datatype: string
  claims: Record<string, Claim[]>
  constraints?: PropertyConstraint[]
}

export interface PropertySearchResult {
  id: PropertyId
  label: string
  description?: string
  datatype: string
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
  claims: Record<string, Claim[]>
  sitelinks?: Record<string, SiteLink>
}

export interface ItemSearchResult {
  id: string
  label: string
  description?: string
  match: {
    type: 'label' | 'alias' | 'description'
    text: string
  }
}

// Statement Types - using proper Wikibase schema types
export type Statement = Claim

export type StatementValue = SnakDataValue

export type Qualifier = Snak

// Reference types are already properly defined in wikibase-schema.ts
export type { Reference } from '@backend/types/wikibase-schema'

// SiteLink Types - using proper Wikibase schema types
export type SiteLink = Sitelink

// Search and API Response Types
export interface SearchOptions {
  limit?: number
  offset?: number
  language?: string
  datatype?: string
  autocomplete?: boolean
}

export interface SearchResponse<T> {
  results: T[]
  totalCount: number
  hasMore: boolean
  query: string
}

export interface ApiResponse<T> {
  data: T
  cached: boolean
  timestamp: string
  instanceId: string
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

// Data Type Mapping
export interface PropertyDataTypeMap {
  [propertyId: string]: string
}

// Cache Types
export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  instanceId: string
}

export interface CacheOptions {
  ttl?: number
  skipCache?: boolean
  invalidateCache?: boolean
}
