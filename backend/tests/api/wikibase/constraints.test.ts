import { wikibaseConstraintsApi } from '@backend/api/wikibase'
import { constraintValidationService } from '@backend/services/constraint-validation.service'
import { treaty } from '@elysiajs/eden'
import { beforeEach, describe, expect, test } from 'bun:test'
import Elysia from 'elysia'

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

const createTestApi = () => {
  return treaty(new Elysia().use(wikibaseConstraintsApi)).api
}

describe('Wikibase Constraints API', () => {
  let api: ReturnType<typeof createTestApi>

  beforeEach(() => {
    // Reset mocks before each test
    Object.assign(constraintValidationService, mockConstraintValidationService)
    api = createTestApi()
  })

  test('should get property constraints', async () => {
    const { data, status, error } = await api.wikibase.constraints
      .properties({ propertyId: 'P31' })
      .get({
        query: { instance: 'wikidata' },
      })

    expect(status).toBe(200)
    expect(data).toEqual({
      data: [
        {
          type: 'format',
          parameters: { pattern: '^P\\d+$' },
          description: 'Property ID format constraint',
        },
      ],
    })
    expect(error).toBeNull()
  })

  test('should validate property values', async () => {
    const { data, status, error } = await api.wikibase.constraints.validate.property.post(
      {
        propertyId: 'P31',
        values: ['Q5'],
      },
      {
        query: { instance: 'wikidata' },
      },
    )

    expect(status).toBe(200)
    expect(data).toEqual({
      data: {
        isValid: true,
        violations: [],
        warnings: [],
        suggestions: [],
      },
    })
    expect(error).toBeNull()
  })

  test('should validate schema', async () => {
    const { data, status, error } = await api.wikibase.constraints.validate.schema.post(
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

    expect(status).toBe(200)
    expect(data).toEqual({
      data: {
        isValid: true,
        violations: [],
        warnings: [],
        suggestions: [],
      },
    })
    expect(error).toBeNull()
  })

  test('should clear constraint cache', async () => {
    const { data, status, error } = await api.wikibase.constraints.cache.delete(
      {},
      {
        query: { instance: 'wikidata' },
      },
    )

    expect(status).toBe(200)
    expect(data).toEqual({
      data: {
        message: 'Cache cleared successfully',
      },
    })
    expect(error).toBeNull()
  })
})
