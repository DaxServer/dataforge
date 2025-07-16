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
  ValidationError,
  ValidationResult,
  ColumnInfo,
  WikibaseDataType,
  StatementRank,
  TransformationRule,
  TransformationFunction,
  TransformationParameter,
  SchemaValidationRule,
  ValidationRule,
  SchemaMapping,
  ColumnReference,
  ValueSchemaMapping,
  ValidatedSchemaMapping
} from '../schema-mapping'

describe('Schema Mapping Types', () => {
  describe('WikibaseSchemaMapping', () => {
    it('should create a valid WikibaseSchemaMapping object', () => {
      const schemaMapping: WikibaseSchemaMapping = {
        id: 'schema-123',
        projectId: 'project-456',
        name: 'Test Schema',
        wikibase: 'https://test.wikibase.org',
        item: {
          id: 'Q123',
          terms: {
            labels: {},
            descriptions: {},
            aliases: {}
          },
          statements: []
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }

      expect(schemaMapping.id).toBe('schema-123')
      expect(schemaMapping.projectId).toBe('project-456')
      expect(schemaMapping.name).toBe('Test Schema')
      expect(schemaMapping.wikibase).toBe('https://test.wikibase.org')
      expect(schemaMapping.item).toBeDefined()
      expect(schemaMapping.createdAt).toBe('2024-01-01T00:00:00Z')
      expect(schemaMapping.updatedAt).toBe('2024-01-01T00:00:00Z')
    })

    it('should handle optional item id', () => {
      const schemaMapping: WikibaseSchemaMapping = {
        id: 'schema-123',
        projectId: 'project-456',
        name: 'Test Schema',
        wikibase: 'https://test.wikibase.org',
        item: {
          terms: {
            labels: {},
            descriptions: {},
            aliases: {}
          },
          statements: []
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }

      expect(schemaMapping.item.id).toBeUndefined()
    })
  })

  describe('TermsSchemaMapping', () => {
    it('should create valid terms mapping with multiple languages', () => {
      const termsMapping: TermsSchemaMapping = {
        labels: {
          'en': { columnName: 'name_en', dataType: 'VARCHAR' },
          'fr': { columnName: 'name_fr', dataType: 'VARCHAR' }
        },
        descriptions: {
          'en': { columnName: 'desc_en', dataType: 'TEXT' }
        },
        aliases: {
          'en': [
            { columnName: 'alias1_en', dataType: 'VARCHAR' },
            { columnName: 'alias2_en', dataType: 'VARCHAR' }
          ]
        }
      }

      expect(termsMapping.labels['en']?.columnName).toBe('name_en')
      expect(termsMapping.labels['fr']?.columnName).toBe('name_fr')
      expect(termsMapping.descriptions['en']?.columnName).toBe('desc_en')
      expect(termsMapping.aliases['en']).toHaveLength(2)
      expect(termsMapping.aliases['en']?.[0]?.columnName).toBe('alias1_en')
    })

    it('should handle empty terms mapping', () => {
      const termsMapping: TermsSchemaMapping = {
        labels: {},
        descriptions: {},
        aliases: {}
      }

      expect(Object.keys(termsMapping.labels)).toHaveLength(0)
      expect(Object.keys(termsMapping.descriptions)).toHaveLength(0)
      expect(Object.keys(termsMapping.aliases)).toHaveLength(0)
    })
  })

  describe('ColumnMapping', () => {
    it('should create basic column mapping', () => {
      const columnMapping: ColumnMapping = {
        columnName: 'test_column',
        dataType: 'VARCHAR'
      }

      expect(columnMapping.columnName).toBe('test_column')
      expect(columnMapping.dataType).toBe('VARCHAR')
      expect(columnMapping.transformation).toBeUndefined()
    })

    it('should create column mapping with transformation', () => {
      const transformationRule: TransformationRule = {
        type: 'expression',
        value: 'UPPER(${column})',
        parameters: { format: 'uppercase' }
      }

      const columnMapping: ColumnMapping = {
        columnName: 'test_column',
        dataType: 'VARCHAR',
        transformation: transformationRule
      }

      expect(columnMapping.transformation).toBeDefined()
      expect(columnMapping.transformation?.type).toBe('expression')
      expect(columnMapping.transformation?.value).toBe('UPPER(${column})')
      expect(columnMapping.transformation?.parameters?.format).toBe('uppercase')
    })
  })

  describe('StatementSchemaMapping', () => {
    it('should create complete statement mapping', () => {
      const propertyRef: PropertyReference = {
        id: 'P123',
        label: 'Test Property',
        dataType: 'string'
      }

      const valueMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'value_col', dataType: 'VARCHAR' },
        dataType: 'string'
      }

      const qualifier: QualifierSchemaMapping = {
        property: { id: 'P456', dataType: 'string' },
        value: {
          type: 'column',
          source: { columnName: 'qualifier_col', dataType: 'VARCHAR' },
          dataType: 'string'
        }
      }

      const reference: ReferenceSchemaMapping = {
        property: { id: 'P854', label: 'reference URL', dataType: 'url' },
        value: {
          type: 'column',
          source: { columnName: 'ref_url', dataType: 'VARCHAR' },
          dataType: 'url'
        }
      }

      const statementMapping: StatementSchemaMapping = {
        id: 'stmt-1',
        property: propertyRef,
        value: valueMapping,
        rank: 'normal',
        qualifiers: [qualifier],
        references: [reference]
      }

      expect(statementMapping.id).toBe('stmt-1')
      expect(statementMapping.property.id).toBe('P123')
      expect(statementMapping.value.type).toBe('column')
      expect(statementMapping.rank).toBe('normal')
      expect(statementMapping.qualifiers).toHaveLength(1)
      expect(statementMapping.references).toHaveLength(1)
    })

    it('should handle different statement ranks', () => {
      const ranks: StatementRank[] = ['preferred', 'normal', 'deprecated']
      
      ranks.forEach(rank => {
        const statementMapping: StatementSchemaMapping = {
          id: `stmt-${rank}`,
          property: { id: 'P123', dataType: 'string' },
          value: {
            type: 'constant',
            source: 'test value',
            dataType: 'string'
          },
          rank,
          qualifiers: [],
          references: []
        }

        expect(statementMapping.rank).toBe(rank)
      })
    })
  })

  describe('ValueMapping', () => {
    it('should create column-based value mapping', () => {
      const columnMapping: ColumnMapping = {
        columnName: 'test_col',
        dataType: 'VARCHAR'
      }

      const valueMapping: ValueMapping = {
        type: 'column',
        source: columnMapping,
        dataType: 'string'
      }

      expect(valueMapping.type).toBe('column')
      expect(typeof valueMapping.source).toBe('object')
      expect((valueMapping.source as ColumnMapping).columnName).toBe('test_col')
    })

    it('should create constant value mapping', () => {
      const valueMapping: ValueMapping = {
        type: 'constant',
        source: 'fixed value',
        dataType: 'string'
      }

      expect(valueMapping.type).toBe('constant')
      expect(valueMapping.source).toBe('fixed value')
    })

    it('should create expression value mapping', () => {
      const valueMapping: ValueMapping = {
        type: 'expression',
        source: 'CONCAT(${col1}, " - ", ${col2})',
        dataType: 'string'
      }

      expect(valueMapping.type).toBe('expression')
      expect(valueMapping.source).toBe('CONCAT(${col1}, " - ", ${col2})')
    })
  })

  describe('WikibaseDataType', () => {
    it('should accept all valid Wikibase data types', () => {
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
        'commonsMedia'
      ]

      validTypes.forEach(dataType => {
        const valueMapping: ValueMapping = {
          type: 'constant',
          source: 'test',
          dataType
        }

        expect(valueMapping.dataType).toBe(dataType)
      })
    })
  })

  describe('ColumnInfo', () => {
    it('should create complete column info', () => {
      const columnInfo: ColumnInfo = {
        name: 'test_column',
        dataType: 'VARCHAR',
        sampleValues: ['value1', 'value2', 'value3'],
        nullable: true,
        uniqueCount: 150
      }

      expect(columnInfo.name).toBe('test_column')
      expect(columnInfo.dataType).toBe('VARCHAR')
      expect(columnInfo.sampleValues).toHaveLength(3)
      expect(columnInfo.nullable).toBe(true)
      expect(columnInfo.uniqueCount).toBe(150)
    })

    it('should handle minimal column info', () => {
      const columnInfo: ColumnInfo = {
        name: 'simple_column',
        dataType: 'INTEGER',
        sampleValues: [],
        nullable: false
      }

      expect(columnInfo.name).toBe('simple_column')
      expect(columnInfo.uniqueCount).toBeUndefined()
    })
  })

  describe('ValidationError', () => {
    it('should create validation error with suggestions', () => {
      const error: ValidationError = {
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Required mapping is missing for labels',
        path: 'item.terms.labels',
        suggestions: ['Add a column mapping for labels', 'Use constant value for labels']
      }

      expect(error.type).toBe('error')
      expect(error.code).toBe('MISSING_REQUIRED_MAPPING')
      expect(error.message).toBe('Required mapping is missing for labels')
      expect(error.path).toBe('item.terms.labels')
      expect(error.suggestions).toHaveLength(2)
    })

    it('should create warning without suggestions', () => {
      const warning: ValidationError = {
        type: 'warning',
        code: 'INCOMPLETE_MAPPING',
        message: 'Some optional fields are not mapped',
        path: 'item.terms.descriptions'
      }

      expect(warning.type).toBe('warning')
      expect(warning.suggestions).toBeUndefined()
    })
  })

  describe('ValidationResult', () => {
    it('should create validation result with errors and warnings', () => {
      const errors: ValidationError[] = [{
        type: 'error',
        code: 'INVALID_PROPERTY',
        message: 'Property P999 does not exist',
        path: 'item.statements[0].property'
      }]

      const warnings: ValidationError[] = [{
        type: 'warning',
        code: 'MISSING_DESCRIPTION',
        message: 'No description mapping provided',
        path: 'item.terms.descriptions'
      }]

      const result: ValidationResult = {
        isValid: false,
        errors,
        warnings
      }

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.warnings).toHaveLength(1)
      expect(result.errors[0]?.code).toBe('INVALID_PROPERTY')
      expect(result.warnings[0]?.code).toBe('MISSING_DESCRIPTION')
    })

    it('should create valid result with no errors', () => {
      const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: []
      }

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })
  })

  describe('TransformationFunction', () => {
    it('should create transformation function with parameters', () => {
      const parameters: TransformationParameter[] = [
        {
          name: 'format',
          type: 'string',
          required: true,
          description: 'Output format pattern'
        },
        {
          name: 'defaultValue',
          type: 'string',
          required: false,
          defaultValue: 'N/A',
          description: 'Default value when input is null'
        }
      ]

      const transformationFunction: TransformationFunction = {
        name: 'formatString',
        description: 'Formats string values according to pattern',
        parameters,
        execute: (input: unknown, params: Record<string, unknown>) => {
          return `${params.format}: ${input}`
        }
      }

      expect(transformationFunction.name).toBe('formatString')
      expect(transformationFunction.description).toBe('Formats string values according to pattern')
      expect(transformationFunction.parameters).toHaveLength(2)
      expect(transformationFunction.parameters[0]?.name).toBe('format')
      expect(transformationFunction.parameters[0]?.required).toBe(true)
      expect(transformationFunction.parameters[1]?.defaultValue).toBe('N/A')
      expect(typeof transformationFunction.execute).toBe('function')
    })

    it('should execute transformation function', () => {
      const transformationFunction: TransformationFunction = {
        name: 'uppercase',
        description: 'Converts input to uppercase',
        parameters: [],
        execute: (input: unknown) => {
          return typeof input === 'string' ? input.toUpperCase() : input
        }
      }

      const result = transformationFunction.execute('hello world', {})
      expect(result).toBe('HELLO WORLD')
    })
  })

  describe('TransformationParameter', () => {
    it('should create required parameter', () => {
      const parameter: TransformationParameter = {
        name: 'pattern',
        type: 'string',
        required: true,
        description: 'Regex pattern for matching'
      }

      expect(parameter.name).toBe('pattern')
      expect(parameter.type).toBe('string')
      expect(parameter.required).toBe(true)
      expect(parameter.description).toBe('Regex pattern for matching')
      expect(parameter.defaultValue).toBeUndefined()
    })

    it('should create optional parameter with default value', () => {
      const parameter: TransformationParameter = {
        name: 'maxLength',
        type: 'number',
        required: false,
        defaultValue: 100
      }

      expect(parameter.name).toBe('maxLength')
      expect(parameter.type).toBe('number')
      expect(parameter.required).toBe(false)
      expect(parameter.defaultValue).toBe(100)
    })

    it('should handle all parameter types', () => {
      const types: Array<TransformationParameter['type']> = [
        'string', 'number', 'boolean', 'array', 'object'
      ]

      types.forEach(type => {
        const parameter: TransformationParameter = {
          name: `param_${type}`,
          type,
          required: false
        }

        expect(parameter.type).toBe(type)
      })
    })
  })

  describe('SchemaValidationRule', () => {
    it('should create validation rule', () => {
      const rule: SchemaValidationRule = {
        id: 'required-labels',
        name: 'Required Labels Validation',
        description: 'Ensures that at least one label mapping exists',
        validate: (schema: WikibaseSchemaMapping) => {
          const errors: ValidationError[] = []
          if (Object.keys(schema.item.terms.labels).length === 0) {
            errors.push({
              type: 'error',
              code: 'MISSING_LABELS',
              message: 'At least one label mapping is required',
              path: 'item.terms.labels'
            })
          }
          return errors
        }
      }

      expect(rule.id).toBe('required-labels')
      expect(rule.name).toBe('Required Labels Validation')
      expect(rule.description).toBe('Ensures that at least one label mapping exists')
      expect(typeof rule.validate).toBe('function')
    })

    it('should execute validation rule', () => {
      const rule: SchemaValidationRule = {
        id: 'test-rule',
        name: 'Test Rule',
        description: 'Test validation rule',
        validate: (schema: WikibaseSchemaMapping) => {
          return Object.keys(schema.item.terms.labels).length === 0 ? [{
            type: 'error',
            code: 'NO_LABELS',
            message: 'No labels found',
            path: 'item.terms.labels'
          }] : []
        }
      }

      const schemaWithLabels: WikibaseSchemaMapping = {
        id: 'test',
        projectId: 'test',
        name: 'test',
        wikibase: 'test',
        item: {
          terms: {
            labels: { 'en': { columnName: 'name', dataType: 'VARCHAR' } },
            descriptions: {},
            aliases: {}
          },
          statements: []
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }

      const schemaWithoutLabels: WikibaseSchemaMapping = {
        ...schemaWithLabels,
        item: {
          ...schemaWithLabels.item,
          terms: {
            labels: {},
            descriptions: {},
            aliases: {}
          }
        }
      }

      const validResult = rule.validate(schemaWithLabels)
      const invalidResult = rule.validate(schemaWithoutLabels)

      expect(validResult).toHaveLength(0)
      expect(invalidResult).toHaveLength(1)
      expect(invalidResult[0]?.code).toBe('NO_LABELS')
    })
  })

  describe('SchemaMapping', () => {
    it('should create complete schema mapping', () => {
      const columnMappings: Record<string, ColumnMapping> = {
        'name_en': { columnName: 'name_en', dataType: 'VARCHAR' },
        'description_en': { columnName: 'description_en', dataType: 'TEXT' }
      }

      const validationRule: ValidationRule = {
        id: 'test-rule',
        name: 'Test Rule',
        description: 'Test validation',
        validate: () => []
      }

      const schemaMapping: SchemaMapping = {
        item: {
          terms: {
            labels: { 'en': columnMappings['name_en']! },
            descriptions: { 'en': columnMappings['description_en']! },
            aliases: {}
          },
          statements: []
        },
        columnMappings,
        validationRules: [validationRule]
      }

      expect(schemaMapping.item.terms.labels['en']?.columnName).toBe('name_en')
      expect(schemaMapping.columnMappings['name_en']?.dataType).toBe('VARCHAR')
      expect(schemaMapping.validationRules).toHaveLength(1)
      expect(schemaMapping.validationRules[0]?.id).toBe('test-rule')
    })
  })

  describe('ColumnReference', () => {
    it('should create column reference', () => {
      const columnRef: ColumnReference = {
        columnName: 'test_column',
        dataType: 'INTEGER',
        required: true
      }

      expect(columnRef.columnName).toBe('test_column')
      expect(columnRef.dataType).toBe('INTEGER')
      expect(columnRef.required).toBe(true)
    })

    it('should create optional column reference', () => {
      const columnRef: ColumnReference = {
        columnName: 'optional_column',
        dataType: 'VARCHAR',
        required: false
      }

      expect(columnRef.required).toBe(false)
    })
  })

  describe('ValueSchemaMapping', () => {
    it('should create value schema mapping with transformation', () => {
      const columnRef: ColumnReference = {
        columnName: 'source_column',
        dataType: 'VARCHAR',
        required: true
      }

      const transformation: TransformationFunction = {
        name: 'trim',
        description: 'Trims whitespace',
        parameters: [],
        execute: (input: unknown) => typeof input === 'string' ? input.trim() : input
      }

      const valueMapping: ValueSchemaMapping = {
        columnReference: columnRef,
        dataType: 'string',
        transformation
      }

      expect(valueMapping.columnReference.columnName).toBe('source_column')
      expect(valueMapping.dataType).toBe('string')
      expect(valueMapping.transformation?.name).toBe('trim')
    })

    it('should create value schema mapping without transformation', () => {
      const columnRef: ColumnReference = {
        columnName: 'simple_column',
        dataType: 'INTEGER',
        required: false
      }

      const valueMapping: ValueSchemaMapping = {
        columnReference: columnRef,
        dataType: 'quantity'
      }

      expect(valueMapping.columnReference.columnName).toBe('simple_column')
      expect(valueMapping.dataType).toBe('quantity')
      expect(valueMapping.transformation).toBeUndefined()
    })
  })

  describe('ValidatedSchemaMapping', () => {
    it('should create validated schema mapping', () => {
      const baseSchema: WikibaseSchemaMapping = {
        id: 'validated-schema',
        projectId: 'project-123',
        name: 'Validated Schema',
        wikibase: 'https://test.wikibase.org',
        item: {
          terms: {
            labels: { 'en': { columnName: 'name', dataType: 'VARCHAR' } },
            descriptions: {},
            aliases: {}
          },
          statements: []
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }

      const validation: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [{
          type: 'warning',
          code: 'MISSING_DESCRIPTION',
          message: 'No description provided',
          path: 'item.terms.descriptions'
        }]
      }

      const validatedSchema: ValidatedSchemaMapping = {
        ...baseSchema,
        validation,
        completeness: 75
      }

      expect(validatedSchema.id).toBe('validated-schema')
      expect(validatedSchema.validation.isValid).toBe(true)
      expect(validatedSchema.validation.warnings).toHaveLength(1)
      expect(validatedSchema.completeness).toBe(75)
    })
  })
})
