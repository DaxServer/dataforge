import type { App } from '@backend/index'
import { constraintValidationService } from '@backend/services/constraint-validation.service'
import { treaty } from '@elysiajs/eden'
import { beforeEach, describe, expect, test } from 'bun:test'

// Mock the constraint validation service
const mockConstraintValidationService = {
  getPropertyConstraints: async (_instanceId: string, _propertyId: string) => [
    {
      type: 'format',
      parameters: { pattern: '^P\\d+$' },
      description: 'Property ID format constraint',
    },
  ],
  validateProperty: async (_instanceId: string, _propertyId: string, _values: any[]) => ({
    isValid: true,
    violations: [],
    warnings: [],
    suggestions: [],
  }),
  validateSchema: async (_instanceId: string, _schema: any) => ({
    isValid: true,
    violations: [],
    warnings: [],
    suggestions: [],
  }),
  clearCache: (_instanceId?: string) => {},
}

// Mock the service
Object.assign(constraintValidationService, mockConstraintValidationService)

const api = treaty<App>('localhost:3000')

describe('Wikibase Constraints API', () => {
  beforeEach(() => {
    // Reset mocks before each test
    Object.assign(constraintValidationService, mockConstraintValidationService)
  })

  test('should get property constraints', async () => {
    const response = await api.api.wikibase.constraints.properties({ propertyId: 'P31' }).get({
      query: { instance: 'wikidata' },
    })

    expect(response.status).toBe(200)
    expect(response.data?.data).toEqual([
      {
        type: 'format',
        parameters: { pattern: '^P\\d+$' },
        description: 'Property ID format constraint',
      },
    ])
  })

  test('should validate property values', async () => {
    const response = await api.api.wikibase.constraints.validate.property.post(
      {
        propertyId: 'P31',
        values: ['Q5'],
      },
      {
        query: { instance: 'wikidata' },
      },
    )

    expect(response.status).toBe(200)
    expect(response.data?.data).toEqual({
      isValid: true,
      violations: [],
      warnings: [],
      suggestions: [],
    })
  })

  test('should validate schema', async () => {
    const response = await api.api.wikibase.constraints.validate.schema.post(
      {
        schema: {
          P31: ['Q5'],
          P21: ['Q6581097'],
        },
      },
      {
        query: { instance: 'wikidata' },
      },
    )

    expect(response.status).toBe(200)
    expect(response.data?.data).toEqual({
      isValid: true,
      violations: [],
      warnings: [],
      suggestions: [],
    })
  })

  test('should clear constraint cache', async () => {
    const response = await api.api.wikibase.constraints.cache.delete(
      {},
      {
        query: { instance: 'wikidata' },
      },
    )

    expect(response.status).toBe(200)
    expect(response.data?.data).toEqual({
      message: 'Cache cleared successfully',
    })
  })
})
