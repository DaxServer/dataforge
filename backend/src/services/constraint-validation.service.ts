import { nodemwWikibaseService } from '@backend/services/nodemw-wikibase.service'
import type {
  PropertyConstraint,
  ValidationResult,
  ConstraintViolation,
  ConstraintWarning,
} from '@backend/types/wikibase-api'
import type { PropertyId } from 'wikibase-sdk'

/**
 * Service for validating Wikibase properties against their constraints using nodemw Wikidata API
 */
export class ConstraintValidationService {
  private constraintCache: Map<string, PropertyConstraint[]> = new Map()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  /**
   * Get constraints for a property using nodemw Wikidata client
   */
  async getPropertyConstraints(
    instanceId: string,
    propertyId: PropertyId,
  ): Promise<PropertyConstraint[]> {
    const cacheKey = `${instanceId}:${propertyId}`

    // Check cache first
    if (this.constraintCache.has(cacheKey)) {
      return this.constraintCache.get(cacheKey)!
    }

    try {
      const wikidataClient = nodemwWikibaseService.getWikidataClient(instanceId)

      // Use nodemw getArticleClaims to fetch property constraints
      const claims = await this.fetchPropertyClaims(wikidataClient, propertyId)
      const constraints = this.parseConstraintsFromClaims(claims)

      // Cache the results
      this.constraintCache.set(cacheKey, constraints)

      // Set cache expiration
      setTimeout(() => {
        this.constraintCache.delete(cacheKey)
      }, this.cacheTimeout)

      return constraints
    } catch (error) {
      throw new Error(
        `Failed to fetch constraints for property ${propertyId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Fetch property claims using nodemw getArticleClaims method
   */
  private async fetchPropertyClaims(wikidataClient: any, propertyId: PropertyId): Promise<any> {
    return new Promise((resolve, reject) => {
      wikidataClient.getArticleClaims(propertyId, (err: any, data: any) => {
        if (err) {
          reject(err)
          return
        }
        resolve(data)
      })
    })
  }

  /**
   * Parse constraints from property claims data
   */
  private parseConstraintsFromClaims(claims: any): PropertyConstraint[] {
    const constraints: PropertyConstraint[] = []

    if (!claims || !claims.claims) {
      return constraints
    }

    // P2302 is the "property constraint" property in Wikidata
    const constraintClaims = claims.claims['P2302'] || []

    for (const claim of constraintClaims) {
      const constraint = this.parseConstraintClaim(claim)
      if (constraint) {
        constraints.push(constraint)
      }
    }

    return constraints
  }

  /**
   * Parse individual constraint claim into PropertyConstraint object
   */
  private parseConstraintClaim(claim: any): PropertyConstraint | null {
    try {
      if (!claim.mainsnak?.datavalue?.value?.id) {
        return null
      }

      const constraintTypeId = claim.mainsnak.datavalue.value.id
      const constraintType = this.getConstraintTypeName(constraintTypeId)
      const parameters = this.extractConstraintParameters(claim)

      return {
        type: constraintType,
        parameters,
        description: this.getConstraintDescription(constraintType),
        violationMessage: this.getConstraintViolationMessage(constraintType),
      }
    } catch (error) {
      console.warn('Failed to parse constraint claim:', error)
      return null
    }
  }

  /**
   * Extract constraint parameters from qualifiers and references
   */
  private extractConstraintParameters(claim: any): Record<string, any> {
    const parameters: Record<string, any> = {}

    if (!claim.qualifiers) {
      return parameters
    }

    // Common constraint parameter properties
    const parameterMap: Record<string, string> = {
      //   'P2306': 'property', // property
      //   'P2305': 'item', // item of property constraint
      //   'P2303': 'regex', // regular expression
      //   'P2313': 'minimum_value', // minimum value
      //   'P2312': 'maximum_value', // maximum value
      //   'P2308': 'class', // class
      //   'P2309': 'relation', // relation
      //   'P2316': 'constraint_status', // constraint status
    }

    for (const [propertyId, parameterName] of Object.entries(parameterMap)) {
      if (claim.qualifiers[propertyId]) {
        const qualifier = claim.qualifiers[propertyId][0]
        if (qualifier?.datavalue?.value) {
          parameters[parameterName] = qualifier.datavalue.value
        }
      }
    }

    return parameters
  }

  /**
   * Get human-readable constraint type name from constraint ID
   */
  private getConstraintTypeName(constraintId: string): string {
    const constraintTypeMap: Record<string, string> = {}

    return constraintTypeMap[constraintId] || constraintId || 'unknown constraint'
  }

  /**
   * Get constraint description
   */
  private getConstraintDescription(constraintType: string): string {
    const descriptions: Record<string, string> = {
      'format constraint': 'Values must match a specific format pattern',
      'allowed values constraint': 'Only specific values are allowed',
      'value type constraint': 'Values must be of a specific type',
      'range constraint': 'Numeric values must be within a specific range',
      'single value constraint': 'Property should have only one value',
      'required qualifier constraint': 'Statements must have specific qualifiers',
      'allowed qualifiers constraint': 'Only specific qualifiers are allowed',
      'value requires statement constraint': 'Values must have additional statements',
      'conflicts with constraint': 'Property conflicts with other properties',
      'item requires statement constraint': 'Items must have specific statements',
      'subject type constraint': 'Subject must be of specific type',
      'single best value constraint': 'Property should have only one preferred value',
      'inverse constraint': 'Property has an inverse relationship',
      'symmetric constraint': 'Property is symmetric',
      'property scope constraint': 'Property has specific scope limitations',
    }

    return descriptions[constraintType] || `Constraint of type: ${constraintType}`
  }

  /**
   * Get constraint violation message
   */
  private getConstraintViolationMessage(constraintType: string): string {
    const violationMessages: Record<string, string> = {
      'format constraint': 'Value does not match the required format',
      'allowed values constraint': 'Value is not in the list of allowed values',
      'value type constraint': 'Value is not of the required type',
      'range constraint': 'Value is outside the allowed range',
      'single value constraint': 'Property has multiple values but should have only one',
      'required qualifier constraint': 'Statement is missing required qualifiers',
      'allowed qualifiers constraint': 'Statement has disallowed qualifiers',
      'value requires statement constraint': 'Value is missing required additional statements',
      'conflicts with constraint': 'Property conflicts with other property values',
      'item requires statement constraint': 'Item is missing required statements',
      'subject type constraint': 'Subject is not of the required type',
      'single best value constraint':
        'Property has multiple preferred values but should have only one',
      'inverse constraint': 'Inverse relationship is not properly maintained',
      'symmetric constraint': 'Symmetric relationship is not properly maintained',
      'property scope constraint': 'Property is used outside its allowed scope',
    }

    return violationMessages[constraintType] || `Violation of ${constraintType} constraint`
  }

  /**
   * Validate a value against format constraint (Q21502408)
   */
  private validateFormatConstraint(
    value: any,
    constraint: PropertyConstraint,
    propertyId: string,
  ): ConstraintViolation | null {
    const regex = constraint.parameters?.regex
    if (!regex || typeof value !== 'string') {
      return null
    }

    try {
      const pattern = new RegExp(regex)
      if (!pattern.test(value)) {
        return {
          constraintType: 'format_constraint',
          message: `Value "${value}" does not match required format pattern: ${regex}`,
          severity: 'error',
          propertyId,
          value,
        }
      }
    } catch {
      return {
        constraintType: 'format_constraint',
        message: `Invalid regex pattern in format constraint: ${regex}`,
        severity: 'error',
        propertyId,
        value,
      }
    }

    return null
  }

  /**
   * Validate a value against allowed values constraint
   */
  private validateAllowedValuesConstraint(
    value: any,
    constraint: PropertyConstraint,
    propertyId: string,
  ): ConstraintViolation | null {
    const allowedValues = constraint.parameters?.allowedValues
    if (!allowedValues || !Array.isArray(allowedValues)) {
      return null
    }

    const valueId = typeof value === 'object' && value?.id ? value.id : value
    const isAllowed = allowedValues.some(allowed => {
      const allowedId = typeof allowed === 'object' && allowed?.id ? allowed.id : allowed
      return allowedId === valueId
    })

    if (!isAllowed) {
      return {
        constraintType: 'allowed_values_constraint',
        message: `Value "${valueId}" is not in the list of allowed values`,
        severity: 'error',
        propertyId,
        value,
      }
    }

    return null
  }

  /**
   * Validate a value against value type constraint (Q21510862)
   */
  private validateValueTypeConstraint(
    value: any,
    constraint: PropertyConstraint,
    propertyId: string,
  ): ConstraintViolation | null {
    const requiredClass = constraint.parameters?.class
    if (!requiredClass) {
      return null
    }

    // For items, check if they are instances of the required class
    if (typeof value === 'object' && value?.id) {
      // This would require additional API calls to check instance relationships
      // For now, we'll implement basic type checking
      return null
    }

    // Basic type validation for literals
    const expectedType = this.getExpectedTypeFromClass(requiredClass)
    const actualType = typeof value

    if (expectedType && actualType !== expectedType) {
      return {
        constraintType: 'value_type_constraint',
        message: `Value type "${actualType}" does not match required type "${expectedType}"`,
        severity: 'error',
        propertyId,
        value,
      }
    }

    return null
  }

  /**
   * Validate a value against range constraint (Q21510851)
   */
  private validateRangeConstraint(
    value: any,
    constraint: PropertyConstraint,
    propertyId: string,
  ): ConstraintViolation | null {
    const minValue = constraint.parameters?.minimum_value
    const maxValue = constraint.parameters?.maximum_value

    if (minValue === undefined && maxValue === undefined) {
      return null
    }

    const numericValue = typeof value === 'number' ? value : parseFloat(value)
    if (isNaN(numericValue)) {
      return {
        constraintType: 'range_constraint',
        message: `Value "${value}" is not a valid number for range constraint`,
        severity: 'error',
        propertyId,
        value,
      }
    }

    if (minValue !== undefined && numericValue < minValue) {
      return {
        constraintType: 'range_constraint',
        message: `Value ${numericValue} is below minimum allowed value ${minValue}`,
        severity: 'error',
        propertyId,
        value,
      }
    }

    if (maxValue !== undefined && numericValue > maxValue) {
      return {
        constraintType: 'range_constraint',
        message: `Value ${numericValue} is above maximum allowed value ${maxValue}`,
        severity: 'error',
        propertyId,
        value,
      }
    }

    return null
  }

  /**
   * Validate cardinality against single value constraint (Q25796498)
   */
  private validateSingleValueConstraint(
    values: any[],
    _constraint: PropertyConstraint,
    propertyId: string,
  ): ConstraintViolation | null {
    if (values.length > 1) {
      return {
        constraintType: 'single_value_constraint',
        message: `Property has ${values.length} values but should have only one`,
        severity: 'error',
        propertyId,
        value: values,
      }
    }

    return null
  }

  /**
   * Get expected JavaScript type from Wikibase class ID
   */
  private getExpectedTypeFromClass(classId: string): string | null {
    const typeMap: Record<string, string> = {
      //   'Q3176558': 'string', // string
      //   'Q21027676': 'number', // integer
      //   'Q1860': 'string', // text
    }

    return typeMap[classId] || null
  }

  /**
   * Validate a property value against its constraints
   */
  async validateProperty(
    instanceId: string,
    propertyId: PropertyId,
    values: any[],
  ): Promise<ValidationResult> {
    const violations: ConstraintViolation[] = []
    const warnings: ConstraintWarning[] = []
    const suggestions: string[] = []

    try {
      const constraints = await this.getPropertyConstraints(instanceId, propertyId)

      for (const constraint of constraints) {
        // Validate each constraint type
        switch (constraint.type) {
          case 'format constraint':
            for (const value of values) {
              const violation = this.validateFormatConstraint(value, constraint, propertyId)
              if (violation) violations.push(violation)
            }
            break

          case 'allowed values constraint':
            for (const value of values) {
              const violation = this.validateAllowedValuesConstraint(value, constraint, propertyId)
              if (violation) violations.push(violation)
            }
            break

          case 'value type constraint':
            for (const value of values) {
              const violation = this.validateValueTypeConstraint(value, constraint, propertyId)
              if (violation) violations.push(violation)
            }
            break

          case 'range constraint':
            for (const value of values) {
              const violation = this.validateRangeConstraint(value, constraint, propertyId)
              if (violation) violations.push(violation)
            }
            break

          case 'single value constraint':
            const violation = this.validateSingleValueConstraint(values, constraint, propertyId)
            if (violation) violations.push(violation)
            break

          default:
            // For unsupported constraint types, add a warning
            warnings.push({
              constraintType: constraint.type,
              message: `Constraint type "${constraint.type}" is not yet supported for validation`,
              propertyId,
            })
        }
      }

      // Add suggestions based on violations
      if (violations.length > 0) {
        suggestions.push('Review property values to ensure they meet all constraint requirements')
      }

      return {
        isValid: violations.length === 0,
        violations,
        warnings,
        suggestions,
      }
    } catch (error) {
      // If constraint fetching fails, return a validation error
      violations.push({
        constraintType: 'system_error',
        message: `Failed to validate property: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error',
        propertyId,
      })

      return {
        isValid: false,
        violations,
        warnings,
        suggestions: ['Check network connection and instance configuration'],
      }
    }
  }

  /**
   * Validate an entire schema against property constraints
   */
  async validateSchema(
    instanceId: string,
    schema: Record<PropertyId, any[]>,
  ): Promise<ValidationResult> {
    const allViolations: ConstraintViolation[] = []
    const allWarnings: ConstraintWarning[] = []
    const allSuggestions: string[] = []

    const propertyIds = Object.keys(schema) as PropertyId[]

    // Validate each property in parallel
    const validationPromises = propertyIds.map(async propertyId => {
      const values = schema[propertyId] || []
      return this.validateProperty(instanceId, propertyId, values)
    })

    try {
      const results = await Promise.all(validationPromises)

      // Aggregate all results
      for (const result of results) {
        allViolations.push(...result.violations)
        allWarnings.push(...result.warnings)
        allSuggestions.push(...result.suggestions)
      }

      // Add schema-level suggestions
      if (allViolations.length > 0) {
        allSuggestions.push('Consider reviewing the entire schema for consistency')
      }

      if (allWarnings.length > 0) {
        allSuggestions.push(
          'Some constraint types are not yet supported - manual review recommended',
        )
      }

      // Remove duplicate suggestions
      const uniqueSuggestions = Array.from(new Set(allSuggestions))

      return {
        isValid: allViolations.length === 0,
        violations: allViolations,
        warnings: allWarnings,
        suggestions: uniqueSuggestions,
      }
    } catch (error) {
      return {
        isValid: false,
        violations: [
          {
            constraintType: 'system_error',
            message: `Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'error',
            propertyId: 'schema',
          },
        ],
        warnings: allWarnings,
        suggestions: ['Check network connection and try again'],
      }
    }
  }

  /**
   * Clear constraint cache for a specific instance or all instances
   */
  clearCache(instanceId?: string): void {
    if (instanceId) {
      const keysToDelete = Array.from(this.constraintCache.keys()).filter(key =>
        key.startsWith(`${instanceId}:`),
      )
      for (const key of keysToDelete) {
        this.constraintCache.delete(key)
      }
    } else {
      this.constraintCache.clear()
    }
  }
}

// Export a singleton instance
export const constraintValidationService = new ConstraintValidationService()
