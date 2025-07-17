import { describe, it, expect } from 'bun:test'
import type {
  WikibaseSchemaMapping,
  TermsSchemaMapping,
  ColumnMapping,
  StatementSchemaMapping,
  PropertyReference,
  ValueMapping,
  QualifierSchemaMapping,
  ReferenceSchemaMapping,
  ColumnInfo,
  WikibaseDataType,
  StatementRank,
  TransformationRule,
  TransformationFunction,
  TransformationParameter,
  ValidationRule,
  SchemaMapping,
  ColumnReference,
  ValueSchemaMapping,
  ValidatedSchemaMapping,
  ValidationError,
  ValidationResult,
} from '@frontend/types/wikibase-schema'

describe('Schema Mapping Types', () => {
  describe('Core Schema Types', () => {
    it('should create WikibaseSchemaMapping with and without optional fields', () => {
      const baseSchema = {
        id: 'schema-123',
        projectId: 'project-456',
        name: 'Test Schema',
        wikibase: 'https://test.wikibase.org',
        item: {
          terms: { labels: {}, descriptions: {}, aliases: {} },
          statements: [],
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      // With item ID
      const schemaWithId: WikibaseSchemaMapping = {
        ...baseSchema,
        item: { ...baseSchema.item, id: 'Q123' },
      }

      // Without item ID
      const schemaWithoutId: WikibaseSchemaMapping = baseSchema

      expect(schemaWithId.item.id).toBe('Q123')
      expect(schemaWithoutId.item.id).toBeUndefined()
      expect(schemaWithId.id).toBe('schema-123')
      expect(schemaWithoutId.projectId).toBe('project-456')
    })
  })

  describe('Mapping Types', () => {
    it('should create TermsSchemaMapping with multiple languages and empty state', () => {
      // Full terms mapping
      const fullTermsMapping: TermsSchemaMapping = {
        labels: {
          en: { columnName: 'name_en', dataType: 'VARCHAR' },
          fr: { columnName: 'name_fr', dataType: 'VARCHAR' },
        },
        descriptions: {
          en: { columnName: 'desc_en', dataType: 'TEXT' },
        },
        aliases: {
          en: [
            { columnName: 'alias1_en', dataType: 'VARCHAR' },
            { columnName: 'alias2_en', dataType: 'VARCHAR' },
          ],
        },
      }

      // Empty terms mapping
      const emptyTermsMapping: TermsSchemaMapping = {
        labels: {},
        descriptions: {},
        aliases: {},
      }

      expect(fullTermsMapping.labels.en?.columnName).toBe('name_en')
      expect(fullTermsMapping.aliases.en).toHaveLength(2)
      expect(Object.keys(emptyTermsMapping.labels)).toHaveLength(0)
    })

    it('should create ColumnMapping with and without transformation', () => {
      // Basic column mapping
      const basicMapping: ColumnMapping = {
        columnName: 'test_column',
        dataType: 'VARCHAR',
      }

      // Column mapping with transformation
      const transformationRule: TransformationRule = {
        type: 'expression',
        value: 'UPPER(${column})',
        parameters: { format: 'uppercase' },
      }

      const mappingWithTransform: ColumnMapping = {
        columnName: 'test_column',
        dataType: 'VARCHAR',
        transformation: transformationRule,
      }

      expect(basicMapping.transformation).toBeUndefined()
      expect(mappingWithTransform.transformation?.type).toBe('expression')
      expect(mappingWithTransform.transformation?.value).toBe('UPPER(${column})')
    })
  })

  describe('StatementSchemaMapping', () => {
    it('should create complete statement mapping', () => {
      const propertyRef: PropertyReference = {
        id: 'P123',
        label: 'Test Property',
        dataType: 'string',
      }

      const valueMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'value_col', dataType: 'VARCHAR' },
        dataType: 'string',
      }

      const qualifier: QualifierSchemaMapping = {
        property: { id: 'P456', dataType: 'string' },
        value: {
          type: 'column',
          source: { columnName: 'qualifier_col', dataType: 'VARCHAR' },
          dataType: 'string',
        },
      }

      const reference: ReferenceSchemaMapping = {
        property: { id: 'P854', label: 'reference URL', dataType: 'url' },
        value: {
          type: 'column',
          source: { columnName: 'ref_url', dataType: 'VARCHAR' },
          dataType: 'url',
        },
      }

      const statementMapping: StatementSchemaMapping = {
        id: 'stmt-1',
        property: propertyRef,
        value: valueMapping,
        rank: 'normal',
        qualifiers: [qualifier],
        references: [reference],
      }

      expect(statementMapping).toEqual({
        id: 'stmt-1',
        property: {
          id: 'P123',
          label: 'Test Property',
          dataType: 'string',
        },
        value: {
          type: 'column',
          source: { columnName: 'value_col', dataType: 'VARCHAR' },
          dataType: 'string',
        },
        rank: 'normal',
        qualifiers: [
          {
            property: { id: 'P456', dataType: 'string' },
            value: {
              type: 'column',
              source: { columnName: 'qualifier_col', dataType: 'VARCHAR' },
              dataType: 'string',
            },
          },
        ],
        references: [
          {
            property: { id: 'P854', label: 'reference URL', dataType: 'url' },
            value: {
              type: 'column',
              source: { columnName: 'ref_url', dataType: 'VARCHAR' },
              dataType: 'url',
            },
          },
        ],
      })
    })

    it('should handle different statement ranks', () => {
      const ranks: StatementRank[] = ['preferred', 'normal', 'deprecated']

      ranks.forEach((rank) => {
        const statementMapping: StatementSchemaMapping = {
          id: `stmt-${rank}`,
          property: { id: 'P123', dataType: 'string' },
          value: {
            type: 'constant',
            source: 'test value',
            dataType: 'string',
          },
          rank,
          qualifiers: [],
          references: [],
        }

        expect(statementMapping.rank).toBe(rank)
      })
    })
  })

  describe('Value and Data Types', () => {
    it('should create all ValueMapping types and handle WikibaseDataType', () => {
      // Column-based value mapping
      const columnMapping: ColumnMapping = {
        columnName: 'test_col',
        dataType: 'VARCHAR',
      }

      const columnValueMapping: ValueMapping = {
        type: 'column',
        source: columnMapping,
        dataType: 'string',
      }

      // Constant value mapping
      const constantValueMapping: ValueMapping = {
        type: 'constant',
        source: 'fixed value',
        dataType: 'string',
      }

      // Expression value mapping
      const expressionValueMapping: ValueMapping = {
        type: 'expression',
        source: 'CONCAT(${col1}, " - ", ${col2})',
        dataType: 'string',
      }

      // Test all valid Wikibase data types
      const validTypes: WikibaseDataType[] = [
        'string',
        'wikibase-item',
        'wikibase-property',
        'quantity',
        'time',
        'globe-coordinate',
        'url',
        'external-id',
        'monolingualtext',
        'commonsMedia',
      ]

      expect(columnValueMapping.type).toBe('column')
      expect(constantValueMapping.type).toBe('constant')
      expect(expressionValueMapping.type).toBe('expression')
      expect(validTypes).toHaveLength(10)

      // Verify data type validation works
      validTypes.forEach((dataType) => {
        const testMapping: ValueMapping = {
          type: 'constant',
          source: 'test',
          dataType,
        }
        expect(testMapping.dataType).toBe(dataType)
      })
    })

    it('should create ColumnInfo with complete and minimal data', () => {
      // Complete column info
      const completeColumnInfo: ColumnInfo = {
        name: 'test_column',
        dataType: 'VARCHAR',
        sampleValues: ['value1', 'value2', 'value3'],
        nullable: true,
        uniqueCount: 150,
      }

      // Minimal column info
      const minimalColumnInfo: ColumnInfo = {
        name: 'simple_column',
        dataType: 'INTEGER',
        sampleValues: [],
        nullable: false,
      }

      expect(completeColumnInfo.uniqueCount).toBe(150)
      expect(completeColumnInfo.sampleValues).toHaveLength(3)
      expect(minimalColumnInfo.uniqueCount).toBeUndefined()
      expect(minimalColumnInfo.nullable).toBe(false)
    })
  })

  describe('Validation Types', () => {
    it('should create ValidationError and ValidationResult types', () => {
      // Create validation error
      const error: ValidationError = {
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Required mapping is missing for labels',
        path: 'item.terms.labels',
      }

      // Create validation warning
      const warning: ValidationError = {
        type: 'warning',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Some optional fields are not mapped',
        path: 'item.terms.descriptions',
      }

      // Create validation result with errors and warnings
      const invalidResult: ValidationResult = {
        isValid: false,
        errors: [error],
        warnings: [warning],
      }

      // Create valid result with no errors
      const validResult: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
      }

      expect(error.type).toBe('error')
      expect(warning.type).toBe('warning')
      expect(invalidResult.isValid).toBe(false)
      expect(invalidResult.errors).toHaveLength(1)
      expect(invalidResult.warnings).toHaveLength(1)
      expect(validResult.isValid).toBe(true)
      expect(validResult.errors).toHaveLength(0)
    })
  })

  describe('Transformation Types', () => {
    it('should create and execute TransformationFunction with TransformationParameter', () => {
      // Create transformation parameters
      const parameters: TransformationParameter[] = [
        {
          name: 'format',
          type: 'string',
          required: true,
          description: 'Output format pattern',
        },
        {
          name: 'defaultValue',
          type: 'string',
          required: false,
          defaultValue: 'N/A',
          description: 'Default value when input is null',
        },
        {
          name: 'maxLength',
          type: 'number',
          required: false,
          defaultValue: 100,
        },
      ]

      // Create transformation function
      const transformationFunction: TransformationFunction = {
        name: 'formatString',
        description: 'Formats string values according to pattern',
        parameters,
        execute: (input: unknown, params: Record<string, unknown>) => {
          return `${params.format}: ${input}`
        },
      }

      // Test all parameter types
      const parameterTypes: Array<TransformationParameter['type']> = [
        'string',
        'number',
        'boolean',
        'array',
        'object',
      ]

      expect(transformationFunction.name).toBe('formatString')
      expect(transformationFunction.parameters).toHaveLength(3)
      expect(transformationFunction.parameters[0]?.required).toBe(true)
      expect(transformationFunction.parameters[1]?.defaultValue).toBe('N/A')
      expect(parameterTypes).toHaveLength(5)

      // Test function execution
      const uppercaseFunction: TransformationFunction = {
        name: 'uppercase',
        description: 'Converts input to uppercase',
        parameters: [],
        execute: (input: unknown) => {
          return typeof input === 'string' ? input.toUpperCase() : input
        },
      }

      const result = uppercaseFunction.execute('hello world', {})
      expect(result).toBe('HELLO WORLD')
    })
  })

  describe('Advanced Schema Types', () => {
    it('should create and execute ValidationRule with SchemaMapping', () => {
      // Create validation rule
      const rule: ValidationRule = {
        id: 'required-labels',
        name: 'Required Labels Validation',
        description: 'Ensures that at least one label mapping exists',
        validate: (schema: WikibaseSchemaMapping) => {
          const errors: ValidationError[] = []
          if (Object.keys(schema.item.terms.labels).length === 0) {
            errors.push({
              type: 'error',
              code: 'MISSING_REQUIRED_MAPPING',
              message: 'At least one label mapping is required',
              path: 'item.terms.labels',
            })
          }
          return errors
        },
      }

      // Create column mappings and schema mapping
      const columnMappings: Record<string, ColumnMapping> = {
        name_en: { columnName: 'name_en', dataType: 'VARCHAR' },
        description_en: { columnName: 'description_en', dataType: 'TEXT' },
      }

      const schemaMapping: SchemaMapping = {
        item: {
          terms: {
            labels: { en: columnMappings['name_en']! },
            descriptions: { en: columnMappings['description_en']! },
            aliases: {},
          },
          statements: [],
        },
        columnMappings,
        validationRules: [rule],
      }

      // Test schemas for validation
      const schemaWithLabels: WikibaseSchemaMapping = {
        id: 'test',
        projectId: 'test',
        name: 'test',
        wikibase: 'test',
        item: {
          terms: {
            labels: { en: { columnName: 'name', dataType: 'VARCHAR' } },
            descriptions: {},
            aliases: {},
          },
          statements: [],
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      const schemaWithoutLabels: WikibaseSchemaMapping = {
        ...schemaWithLabels,
        item: {
          ...schemaWithLabels.item,
          terms: { labels: {}, descriptions: {}, aliases: {} },
        },
      }

      // Test validation rule execution
      const validResult = rule.validate(schemaWithLabels)
      const invalidResult = rule.validate(schemaWithoutLabels)

      expect(rule.id).toBe('required-labels')
      expect(schemaMapping.validationRules).toHaveLength(1)
      expect(schemaMapping.item.terms.labels['en']?.columnName).toBe('name_en')
      expect(validResult).toHaveLength(0)
      expect(invalidResult).toHaveLength(1)
      expect(invalidResult[0]?.code).toBe('MISSING_REQUIRED_MAPPING')
    })

    it('should create ColumnReference and ValueSchemaMapping with optional features', () => {
      // Required column reference
      const requiredColumnRef: ColumnReference = {
        columnName: 'test_column',
        dataType: 'INTEGER',
        required: true,
      }

      // Optional column reference
      const optionalColumnRef: ColumnReference = {
        columnName: 'optional_column',
        dataType: 'VARCHAR',
        required: false,
      }

      // Value schema mapping with transformation
      const transformation: TransformationFunction = {
        name: 'trim',
        description: 'Trims whitespace',
        parameters: [],
        execute: (input: unknown) => (typeof input === 'string' ? input.trim() : input),
      }

      const valueMappingWithTransform: ValueSchemaMapping = {
        columnReference: requiredColumnRef,
        dataType: 'string',
        transformation,
      }

      // Value schema mapping without transformation
      const valueMappingSimple: ValueSchemaMapping = {
        columnReference: optionalColumnRef,
        dataType: 'quantity',
      }

      expect(requiredColumnRef.required).toBe(true)
      expect(optionalColumnRef.required).toBe(false)
      expect(valueMappingWithTransform.transformation?.name).toBe('trim')
      expect(valueMappingSimple.transformation).toBeUndefined()
    })

    it('should create ValidatedSchemaMapping with validation results', () => {
      const baseSchema: WikibaseSchemaMapping = {
        id: 'validated-schema',
        projectId: 'project-123',
        name: 'Validated Schema',
        wikibase: 'https://test.wikibase.org',
        item: {
          terms: {
            labels: { en: { columnName: 'name', dataType: 'VARCHAR' } },
            descriptions: {},
            aliases: {},
          },
          statements: [],
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      const validation: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [
          {
            type: 'warning',
            code: 'MISSING_REQUIRED_MAPPING',
            message: 'No description provided',
            path: 'item.terms.descriptions',
          },
        ],
      }

      const validatedSchema: ValidatedSchemaMapping = {
        ...baseSchema,
        validation,
        completeness: 75,
      }

      expect(validatedSchema.validation.isValid).toBe(true)
      expect(validatedSchema.validation.warnings).toHaveLength(1)
      expect(validatedSchema.completeness).toBe(75)
      expect(validatedSchema.id).toBe('validated-schema')
    })
  })
})
