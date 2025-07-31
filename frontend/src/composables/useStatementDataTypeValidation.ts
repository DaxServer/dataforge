import type {
  PropertyReference,
  ValueMapping,
  WikibaseDataType,
  ValidationError,
  ValidationResult,
  ValidationContext,
} from '@frontend/types/wikibase-schema'
import { useDataTypeCompatibility } from '@frontend/composables/useDataTypeCompatibility'
import { useValidationErrors } from '@frontend/composables/useValidationErrors'

/**
 * Composable for validating data type compatibility in statement values
 */
export const useStatementDataTypeValidation = () => {
  const { isDataTypeCompatible, getCompatibleWikibaseTypes } = useDataTypeCompatibility()
  const { createError, createWarning } = useValidationErrors()

  /**
   * Validate data type compatibility for a statement value mapping
   */
  const validateStatementDataType = (
    valueMapping: ValueMapping,
    property: PropertyReference | null,
    path: string,
  ): ValidationResult => {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    // Check if property exists
    if (!property) {
      errors.push(
        createError('INVALID_PROPERTY_ID', path, {
          schemaPath: path,
        }),
      )
      return { isValid: false, errors, warnings }
    }

    // Only validate column-type mappings
    if (valueMapping.type !== 'column') {
      return { isValid: true, errors: [], warnings: [] }
    }

    // Check if column source exists
    const source = valueMapping.source
    if (typeof source !== 'object' || !source.columnName) {
      errors.push(
        createError('MISSING_STATEMENT_VALUE', path, {
          propertyId: property.id,
          schemaPath: path,
        }),
      )
      return { isValid: false, errors, warnings }
    }

    // Check data type compatibility
    const isCompatible = isDataTypeCompatible(source.dataType, [valueMapping.dataType])

    if (!isCompatible) {
      const context: ValidationContext = {
        columnName: source.columnName,
        dataType: source.dataType,
        targetType: valueMapping.dataType,
        propertyId: property.id,
        schemaPath: path,
      }

      errors.push(
        createError(
          'INCOMPATIBLE_DATA_TYPE',
          path,
          context,
          `Column type ${source.dataType} is not compatible with ${valueMapping.dataType}`,
        ),
      )
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Get compatibility warnings for potentially suboptimal but valid mappings
   */
  const getCompatibilityWarnings = (
    valueMapping: ValueMapping,
    property: PropertyReference | null,
    path: string,
  ): ValidationError[] => {
    const warnings: ValidationError[] = []

    // Only check column-type mappings
    if (valueMapping.type !== 'column' || !property) {
      return warnings
    }

    const source = valueMapping.source
    if (typeof source !== 'object' || !source.columnName) {
      return warnings
    }

    // Get all compatible types for the column
    const compatibleTypes = getCompatibleWikibaseTypes(source.dataType)
    const isOptimal = compatibleTypes.indexOf(valueMapping.dataType) <= 1 // First two are most optimal

    // If the mapping is valid but not optimal, add a warning
    if (compatibleTypes.includes(valueMapping.dataType) && !isOptimal) {
      const context: ValidationContext = {
        columnName: source.columnName,
        dataType: source.dataType,
        targetType: valueMapping.dataType,
        propertyId: property.id,
        schemaPath: path,
      }

      warnings.push(
        createWarning(
          'INCOMPATIBLE_DATA_TYPE',
          path,
          context,
          `Data type ${valueMapping.dataType} may not be optimal for column type ${source.dataType}`,
        ),
      )
    }

    return warnings
  }

  /**
   * Get suggested data types for a column type
   */
  const getSuggestedDataTypes = (columnType: string): WikibaseDataType[] => {
    return getCompatibleWikibaseTypes(columnType)
  }

  /**
   * Validate a complete statement value including property and value mapping
   */
  const validateStatementValue = (
    statement: {
      property: PropertyReference | null
      value: ValueMapping
      rank: string
    },
    path: string,
  ): ValidationResult => {
    return validateStatementDataType(statement.value, statement.property, `${path}.value`)
  }

  /**
   * Check if a statement has valid data type mapping
   */
  const isValidStatementDataType = (
    valueMapping: ValueMapping,
    property: PropertyReference | null,
  ): boolean => {
    const result = validateStatementDataType(valueMapping, property, 'temp')
    return result.isValid
  }

  /**
   * Get validation error message for display
   */
  const getDataTypeValidationMessage = (
    valueMapping: ValueMapping,
    property: PropertyReference | null,
  ): string | null => {
    const result = validateStatementDataType(valueMapping, property, 'temp')

    if (result.errors.length > 0) {
      return result.errors[0]!.message
    }

    const warnings = getCompatibilityWarnings(valueMapping, property, 'temp')
    if (warnings.length > 0) {
      return warnings[0]!.message
    }

    return null
  }

  return {
    validateStatementDataType,
    getCompatibilityWarnings,
    getSuggestedDataTypes,
    validateStatementValue,
    isValidStatementDataType,
    getDataTypeValidationMessage,
  }
}
