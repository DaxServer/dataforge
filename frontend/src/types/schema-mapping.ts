import type { ItemId, PropertyId } from '@backend/types/wikibase-schema'

// Core schema mapping interfaces
export interface WikibaseSchemaMapping {
  id: string
  projectId: string
  name: string
  wikibase: string
  item: ItemSchemaMapping
  createdAt: string
  updatedAt: string
}

export interface ItemSchemaMapping {
  id?: ItemId
  terms: TermsSchemaMapping
  statements: StatementSchemaMapping[]
}

export interface TermsSchemaMapping {
  labels: Record<string, ColumnMapping> // language code -> column mapping
  descriptions: Record<string, ColumnMapping>
  aliases: Record<string, ColumnMapping[]>
}

export interface ColumnMapping {
  columnName: string
  dataType: string
  transformation?: TransformationRule
}

export interface TransformationRule {
  type: 'constant' | 'expression' | 'lookup'
  value: string
  parameters?: Record<string, unknown>
}

// Transformation function interface for more complex transformations
export interface TransformationFunction {
  name: string
  description: string
  parameters: TransformationParameter[]
  execute: (input: unknown, params: Record<string, unknown>) => unknown
}

export interface TransformationParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  required: boolean
  defaultValue?: unknown
  description?: string
}

export interface StatementSchemaMapping {
  id: string
  property: PropertyReference
  value: ValueMapping
  rank: StatementRank
  qualifiers: QualifierSchemaMapping[]
  references: ReferenceSchemaMapping[]
}

export interface PropertyReference {
  id: PropertyId // P-ID using existing PropertyId type
  label?: string
  dataType: string
}

export interface ValueMapping {
  type: 'column' | 'constant' | 'expression'
  source: ColumnMapping | string
  dataType: WikibaseDataType
}

export interface QualifierSchemaMapping {
  property: PropertyReference
  value: ValueMapping
}

export interface ReferenceSchemaMapping {
  property: PropertyReference
  value: ValueMapping
}

export type StatementRank = 'preferred' | 'normal' | 'deprecated'

// Wikibase data types
export type WikibaseDataType =
  | 'string'
  | 'wikibase-item'
  | 'wikibase-property'
  | 'quantity'
  | 'time'
  | 'globe-coordinate'
  | 'url'
  | 'external-id'
  | 'monolingualtext'
  | 'commonsMedia'

// Column information interface
export interface ColumnInfo {
  name: string
  dataType: string
  sampleValues: string[]
  nullable: boolean
  uniqueCount?: number
}

// Validation interfaces
export interface ValidationError {
  type: 'warning' | 'error'
  code: string
  message: string
  path: string
  suggestions?: string[]
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

// Schema validation rules
export interface SchemaValidationRule {
  id: string
  name: string
  description: string
  validate: (schema: WikibaseSchemaMapping) => ValidationError[]
}

// Alias for ValidationRule mentioned in design document
export type ValidationRule = SchemaValidationRule

// Additional interfaces from design document
export interface SchemaMapping {
  item: ItemSchemaMapping
  columnMappings: Record<string, ColumnMapping>
  validationRules: ValidationRule[]
}

export interface ColumnReference {
  columnName: string
  dataType: string
  required: boolean
}

export interface ValueSchemaMapping {
  columnReference: ColumnReference
  dataType: WikibaseDataType
  transformation?: TransformationFunction
}

// Extended schema mapping with validation
export interface ValidatedSchemaMapping extends WikibaseSchemaMapping {
  validation: ValidationResult
  completeness: number // 0-100 percentage
}
