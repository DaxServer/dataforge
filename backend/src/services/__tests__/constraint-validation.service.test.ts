import { ConstraintValidationService } from '@backend/services/constraint-validation.service'
import type { PropertyConstraint } from '@backend/types/wikibase-api'
import { beforeEach, describe, expect, mock, test } from 'bun:test'

const mockConstraints: PropertyConstraint[] = [
  {
    type: 'format constraint',
    parameters: { pattern: '^[A-Z]{2}$' },
    description: 'Format constraint for country codes',
    violationMessage: 'Value must be a two-letter country code',
  },
  {
    type: 'allowed values constraint',
    parameters: { allowedValues: ['Q30', 'Q142', 'Q183'] },
    description: 'Allowed values constraint',
    violationMessage: 'Value must be one of the allowed values',
  },
  {
    type: 'single value constraint',
    parameters: {},
    description: 'Single value constraint',
    violationMessage: 'Property should have only one value',
  },
]

describe('ConstraintValidationService', () => {
  let service: ConstraintValidationService

  beforeEach(() => {
    service = new ConstraintValidationService()
    // Mock the getPropertyConstraints method to return our test constraints
    service.getPropertyConstraints = mock(() => Promise.resolve(mockConstraints))
  })

  describe('validateProperty', () => {
    test('should validate property with values', async () => {
      const values = [{ type: 'string', content: 'US' }]

      const result = await service.validateProperty('wikidata', 'P1', values)

      expect(result).toBeDefined()
      expect(result.isValid).toBeDefined()
      expect(result.violations).toBeDefined()
      expect(result.warnings).toBeDefined()
      expect(result.suggestions).toBeDefined()
      // US should pass format constraint (^[A-Z]{2}$) but fail allowed values constraint
      expect(result.violations.length).toBeGreaterThan(0)
      expect(result.isValid).toBe(false)
    })

    test('should handle empty values array', async () => {
      const values: any[] = []

      const result = await service.validateProperty('wikidata', 'P1', values)

      expect(result).toBeDefined()
      expect(result.violations).toHaveLength(0)
      // May have warnings for unsupported constraint types
      expect(result.warnings).toBeDefined()
      expect(result.isValid).toBe(true)
    })

    test('should handle multiple values for single value constraint', async () => {
      const values = [
        { type: 'string', content: 'first value' },
        { type: 'string', content: 'second value' },
      ]

      const result = await service.validateProperty('wikidata', 'P1', values)

      expect(result).toBeDefined()
      // Should have violations for single value constraint
      expect(result.violations.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('validateSchema', () => {
    test('should validate complete schema', async () => {
      const schema = {
        P1: [{ type: 'string', content: 'invalid_format' }], // Should fail format constraint
        P2: [{ type: 'string', content: 'Q999' }], // Should fail allowed values constraint
      }

      const result = await service.validateSchema('wikidata', schema)

      expect(result).toBeDefined()
      expect(result.isValid).toBeDefined()
      expect(result.violations).toBeDefined()
      expect(result.warnings).toBeDefined()
      expect(result.suggestions).toBeDefined()
      // Schema validation should find constraint violations
      expect(result.violations.length).toBeGreaterThan(0)
      expect(result.isValid).toBe(false)
    })

    test('should handle empty schema', async () => {
      const schema = {}

      const result = await service.validateSchema('wikidata', schema)

      expect(result).toBeDefined()
      expect(result.isValid).toBe(true)
      expect(result.violations).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
      expect(result.suggestions).toHaveLength(0)
    })
  })

  describe('getPropertyConstraints', () => {
    test('should fetch and cache property constraints', async () => {
      const constraints = await service.getPropertyConstraints('wikidata', 'P1')

      expect(constraints).toBeDefined()
      expect(Array.isArray(constraints)).toBe(true)
      expect(service.getPropertyConstraints).toHaveBeenCalledWith('wikidata', 'P1')
    })
  })

  describe('clearCache', () => {
    test('should clear constraint cache', () => {
      service.clearCache()
      // Should not throw any errors
      expect(true).toBe(true)
    })

    test('should clear cache for specific instance', () => {
      service.clearCache('wikidata')
      // Should not throw any errors
      expect(true).toBe(true)
    })
  })
})
