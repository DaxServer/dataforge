/**
 * Core Wikibase API type definitions for REST API integration
 */

// Instance Configuration
export interface WikibaseInstanceConfig {
  id: string
  name: string
  baseUrl: string
  userAgent: string
  authToken?: string
  isDefault?: boolean
  metadata?: {
    description?: string
    language?: string
    version?: string
  }
}

// Property Types
export interface PropertyDetails {
  id: string
  labels: Record<string, string>
  descriptions: Record<string, string>
  aliases: Record<string, string[]>
  dataType: string
  statements: Statement[]
  constraints?: PropertyConstraint[]
}

export interface PropertySearchResult {
  id: string
  label: string
  description?: string
  dataType: string
  match: {
    type: 'label' | 'alias' | 'description'
    text: string
  }
}

export interface PropertyConstraint {
  type: string
  parameters: Record<string, any>
  description?: string
  violationMessage?: string
}

// Item Types
export interface ItemDetails {
  id: string
  labels: Record<string, string>
  descriptions: Record<string, string>
  aliases: Record<string, string[]>
  statements: Statement[]
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

// Statement Types
export interface Statement {
  id: string
  property: string
  value: StatementValue
  qualifiers?: Qualifier[]
  references?: Reference[]
  rank: 'preferred' | 'normal' | 'deprecated'
}

export interface StatementValue {
  type: string
  content: any
}

export interface Qualifier {
  property: string
  value: StatementValue
}

export interface Reference {
  parts: ReferencePart[]
}

export interface ReferencePart {
  property: string
  value: StatementValue
}

// Site Link Types
export interface SiteLink {
  site: string
  title: string
  badges?: string[]
}

// Search and API Response Types
export interface SearchOptions {
  limit?: number
  offset?: number
  language?: string
  dataType?: string
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
  value?: any
}

export interface ConstraintWarning {
  constraintType: string
  message: string
  propertyId: string
  value?: any
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
