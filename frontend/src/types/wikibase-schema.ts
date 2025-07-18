import type { ItemId, PropertyId } from '@backend/types/wikibase-schema'

/**
 * Frontend-specific Wikibase schema types for the DataForge application
 * These types extend and complement the backend schema definitions
 */

export type ValidationErrorType = 'error' | 'warning'

export type ValidationErrorCode =
  | 'MISSING_REQUIRED_MAPPING'
  | 'INCOMPATIBLE_DATA_TYPE'
  | 'DUPLICATE_LANGUAGE_MAPPING'
  | 'INVALID_PROPERTY_ID'
  | 'MISSING_STATEMENT_VALUE'
  | 'INVALID_LANGUAGE_CODE'
  | 'MISSING_ITEM_CONFIGURATION'
  | 'DUPLICATE_PROPERTY_MAPPING'

export interface ValidationError {
  type: ValidationErrorType
  code: ValidationErrorCode
  message: string
  path: string
  field?: string
  context?: Record<string, any>
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

export interface ValidationContext {
  columnName?: string
  propertyId?: string
  languageCode?: string
  dataType?: string
  targetType?: string
  schemaPath?: string
}

// Predefined error messages for consistency
export const ValidationMessages: Record<ValidationErrorCode, string> = {
  MISSING_REQUIRED_MAPPING: 'Required mapping is missing',
  INCOMPATIBLE_DATA_TYPE: 'Column data type is incompatible with target',
  DUPLICATE_LANGUAGE_MAPPING: 'Multiple mappings exist for the same language',
  INVALID_PROPERTY_ID: 'Invalid or non-existent property ID',
  MISSING_STATEMENT_VALUE: 'Statement is missing a required value mapping',
  INVALID_LANGUAGE_CODE: 'Invalid language code format',
  MISSING_ITEM_CONFIGURATION: 'Item configuration is required',
  DUPLICATE_PROPERTY_MAPPING: 'Property is already mapped in this context',
}

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

// Schema validation rules
export interface ValidationRule {
  id: string
  name: string
  description: string
  validate: (schema: WikibaseSchemaMapping) => ValidationError[]
}

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
