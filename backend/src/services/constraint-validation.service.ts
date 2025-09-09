import { wikibaseService } from '@backend/services/wikibase.service'
import type {
  ConstraintViolation,
  ConstraintWarning,
  PropertyConstraint,
  ValidationResult,
} from '@backend/types/wikibase-api'
import type { PropertyId } from '@backend/types/wikibase-schema'

export class ConstraintValidationService {
  private constraintCache: Map<string, PropertyConstraint[]> = new Map()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  /**
   * Get constraints for a property using MediaWiki API
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
      // Use MediaWiki API to fetch property constraints
      const property = await wikibaseService.getProperty(instanceId, propertyId)
      const constraints = this.parseConstraintsFromProperty(property)

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
   * Parse constraints from property data
   */
  private parseConstraintsFromProperty(property: any): PropertyConstraint[] {
    const constraints: PropertyConstraint[] = []

    if (!property || !property.statements) {
      return constraints
    }

    const constraintStatements = property.statements[property.id]

    for (const statement of constraintStatements) {
      const constraint = this.parseConstraintStatement(statement)
      if (constraint) {
        constraints.push(constraint)
      }
    }

    return constraints
  }

  /**
   * Parse individual constraint statement into PropertyConstraint object
   */
  private parseConstraintStatement(statement: any): PropertyConstraint | null {
    if (!statement.mainsnak?.datavalue?.value?.id) {
      return null
    }

    try {
      const constraintTypeId = statement.mainsnak.datavalue.value.id
      const constraintType = this.getConstraintTypeName(constraintTypeId)
      const parameters = this.extractConstraintParameters(statement)

      return {
        type: constraintType,
        parameters,
        description: this.getConstraintDescription(constraintType),
        violationMessage: this.getConstraintViolationMessage(constraintType),
      }
    } catch (error) {
      console.warn('Failed to parse constraint statement:', error)
      return null
    }
  }

  /**
   * Extract constraint parameters from qualifiers and references
   */
  private extractConstraintParameters(statement: any): Record<string, any> {
    const parameters: Record<string, any> = {}

    if (!statement.qualifiers) {
      return parameters
    }

    // Extract parameters from qualifiers
    for (const [propertyId, qualifiers] of Object.entries(statement.qualifiers)) {
      if (Array.isArray(qualifiers) && qualifiers.length > 0) {
        const qualifier = qualifiers[0]
        if (qualifier?.datavalue?.value) {
          parameters[propertyId] = qualifier.datavalue.value
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
    propertyId: PropertyId,
  ): ConstraintViolation | null {
    const patternParam = constraint.parameters?.pattern
    if (!patternParam) {
      return null
    }

    // Extract pattern from SnakDataValue structure
    const pattern = typeof patternParam === 'string' ? patternParam : patternParam.value

    if (!pattern || typeof pattern !== 'string') {
      return null
    }

    const stringValue = typeof value === 'object' && value?.content ? value.content : String(value)

    try {
      const regex = new RegExp(pattern)
      if (!regex.test(stringValue)) {
        return {
          constraintType: 'format_constraint',
          message: `Value "${stringValue}" does not match required format: ${pattern}`,
          severity: 'error',
          propertyId,
        }
      }
    } catch {
      // Invalid regex pattern
      return {
        constraintType: 'format_constraint',
        message: `Invalid regex pattern: ${pattern}`,
        severity: 'error',
        propertyId,
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
    propertyId: PropertyId,
  ): ConstraintViolation | null {
    const allowedValuesParam = constraint.parameters?.allowedValues
    if (!allowedValuesParam) {
      return null
    }

    // Extract array from SnakDataValue structure
    const allowedValues = Array.isArray(allowedValuesParam)
      ? allowedValuesParam
      : allowedValuesParam.value

    if (!Array.isArray(allowedValues)) {
      return null
    }

    const valueId = typeof value === 'object' && value?.id ? value.id : value
    const isAllowed = allowedValues.some((allowed) => {
      const allowedId = typeof allowed === 'object' && allowed?.id ? allowed.id : allowed
      return allowedId === valueId
    })

    if (!isAllowed) {
      return {
        constraintType: 'allowed_values_constraint',
        message: `Value "${valueId}" is not in the list of allowed values`,
        severity: 'error',
        propertyId,
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
    propertyId: PropertyId,
  ): ConstraintViolation | null {
    const requiredClassParam = constraint.parameters?.class
    if (!requiredClassParam) {
      return null
    }

    // Extract string value from SnakDataValue if needed
    const requiredClass =
      typeof requiredClassParam === 'string'
        ? requiredClassParam
        : (requiredClassParam as any)?.value || String(requiredClassParam)

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
    propertyId: PropertyId,
  ): ConstraintViolation | null {
    const minValueSnak = constraint.parameters?.minimum_value
    const maxValueSnak = constraint.parameters?.maximum_value

    const minValue =
      minValueSnak?.type === 'quantity' ? parseFloat(minValueSnak.value.amount) : undefined
    const maxValue =
      maxValueSnak?.type === 'quantity' ? parseFloat(maxValueSnak.value.amount) : undefined

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
    values: unknown[],
    _constraint: PropertyConstraint,
    propertyId: PropertyId,
  ): ConstraintViolation | null {
    if (values.length > 1) {
      return {
        constraintType: 'single_value_constraint',
        message: `Property has ${values.length} values but should have only one`,
        severity: 'error',
        propertyId,
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
    schema: Record<string, unknown[]>,
  ): Promise<ValidationResult> {
    const allViolations: ConstraintViolation[] = []
    const allWarnings: ConstraintWarning[] = []
    const allSuggestions: string[] = []

    const propertyIds = Object.keys(schema) as PropertyId[]

    // Validate each property in parallel
    const validationPromises = propertyIds.map(async (propertyId) => {
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
      const keysToDelete = Array.from(this.constraintCache.keys()).filter((key) =>
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
