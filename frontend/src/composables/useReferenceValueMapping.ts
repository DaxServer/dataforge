import { ref } from 'vue'
import type {
  ValueMapping,
  ColumnInfo,
  WikibaseDataType,
  PropertyReference,
  ReferenceSchemaMapping,
  ReferenceSnakSchemaMapping,
} from '@frontend/types/wikibase-schema'

/**
 * Composable for handling reference-specific value mapping and citation data support
 */
export const useReferenceValueMapping = () => {
  // Data type compatibility mapping for reference properties
  const referenceDataTypeCompatibility = ref<Record<string, string[]>>({
    url: ['VARCHAR', 'TEXT', 'STRING'],
    time: ['DATE', 'DATETIME', 'TIMESTAMP'],
    'wikibase-item': ['VARCHAR', 'TEXT', 'STRING'],
    string: ['VARCHAR', 'TEXT', 'STRING'],
    'external-id': ['VARCHAR', 'TEXT', 'STRING'],
    quantity: ['INTEGER', 'DECIMAL', 'NUMERIC', 'FLOAT'],
  })

  /**
   * Check if a column data type is compatible with a reference property data type
   */
  const isReferenceDataTypeCompatible = (
    columnDataType: string,
    referencePropertyDataType: string,
  ): boolean => {
    const acceptedColumnTypes =
      referenceDataTypeCompatibility.value[referencePropertyDataType] || []
    return acceptedColumnTypes.includes(columnDataType.toUpperCase())
  }

  /**
   * Suggest appropriate Wikibase data type for a reference value mapping
   */
  const suggestReferenceDataType = (
    columnInfo: ColumnInfo,
    propertyDataType: string,
  ): WikibaseDataType => {
    const columnType = columnInfo.dataType.toUpperCase()

    // If property data type is compatible with column, use it
    if (isReferenceDataTypeCompatible(columnInfo.dataType, propertyDataType)) {
      return propertyDataType as WikibaseDataType
    }

    // Fallback suggestions based on column type and sample values
    if (['DATE', 'DATETIME', 'TIMESTAMP'].includes(columnType)) {
      return 'time'
    }
    if (['INTEGER', 'DECIMAL', 'NUMERIC', 'FLOAT'].includes(columnType)) {
      return 'quantity'
    }
    if (columnInfo.sampleValues.some((val) => val.startsWith('http'))) {
      return 'url'
    }

    return 'string' // Default fallback
  }

  /**
   * Create a reference value mapping from a column
   */
  const createReferenceValueMappingFromColumn = (
    columnInfo: ColumnInfo,
    propertyDataType: string,
  ): ValueMapping => {
    const suggestedDataType = suggestReferenceDataType(columnInfo, propertyDataType)

    return {
      type: 'column',
      source: {
        columnName: columnInfo.name,
        dataType: columnInfo.dataType,
      },
      dataType: suggestedDataType,
    }
  }

  /**
   * Create a complete citation reference with multiple snaks
   */
  const createCitationReference = (snaks: ReferenceSnakSchemaMapping[]): ReferenceSchemaMapping => {
    return {
      id: `ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      snaks,
    }
  }

  /**
   * Validate a reference snak mapping
   */
  const validateReferenceSnakMapping = (
    snak: ReferenceSnakSchemaMapping,
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    // Validate property
    if (!snak.property.id.startsWith('P')) {
      errors.push('Property ID must start with P')
    }
    if (!snak.property.dataType) {
      errors.push('Property data type is required')
    }

    // Validate value
    if (snak.value.type === 'column') {
      const source = snak.value.source
      if (typeof source === 'object' && !source.columnName) {
        errors.push('Column name is required for column mapping')
      }
      if (typeof source === 'object' && source.dataType) {
        const isCompatible = isReferenceDataTypeCompatible(source.dataType, snak.property.dataType)
        if (!isCompatible) {
          errors.push(
            `Column type ${source.dataType} is not compatible with property type ${snak.property.dataType}`,
          )
        }
      }
    } else if (snak.value.type === 'constant' || snak.value.type === 'expression') {
      if (typeof snak.value.source === 'string' && !snak.value.source.trim()) {
        errors.push('Value source is required')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Validate a complete reference mapping
   */
  const validateReferenceMapping = (
    reference: ReferenceSchemaMapping,
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    // Validate reference structure
    if (!reference.id) {
      errors.push('Reference ID is required')
    }
    if (!reference.snaks || reference.snaks.length === 0) {
      errors.push('Reference must contain at least one property-value pair')
    }

    // Validate each snak
    reference.snaks.forEach((snak, index) => {
      const snakValidation = validateReferenceSnakMapping(snak)
      if (!snakValidation.isValid) {
        errors.push(`Snak ${index + 1}: ${snakValidation.errors.join(', ')}`)
      }
    })

    // Check for duplicate properties within the same reference
    const propertyIds = reference.snaks.map((snak) => snak.property.id)
    const duplicates = propertyIds.filter((id, index) => propertyIds.indexOf(id) !== index)
    if (duplicates.length > 0) {
      errors.push(`Duplicate properties in reference: ${duplicates.join(', ')}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  return {
    // State
    referenceDataTypeCompatibility,

    // Methods
    isReferenceDataTypeCompatible,
    suggestReferenceDataType,
    createReferenceValueMappingFromColumn,
    createCitationReference,
    validateReferenceSnakMapping,
    validateReferenceMapping,
  }
}
