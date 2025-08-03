import { useDataTypeCompatibility } from '@frontend/features/data-processing/composables/useDataTypeCompatibility'
import type { ColumnInfo } from '@frontend/shared/types/wikibase-schema'
import type { DropTarget } from '@frontend/shared/types/drag-drop'

interface CoreValidationResult {
  isValid: boolean
  reason?: string
  message?: string
}

/**
 * Core validation composable - single source of truth for all validation logic
 */
export const useValidationCore = () => {
  const { isDataTypeCompatible } = useDataTypeCompatibility()

  /**
   * Core validation function for column-target compatibility
   */
  const validateColumnForTarget = (
    columnInfo: ColumnInfo,
    target: DropTarget,
  ): CoreValidationResult => {
    // 1. Data type compatibility
    if (!isDataTypeCompatible(columnInfo.dataType, target.acceptedTypes)) {
      return {
        isValid: false,
        reason: 'incompatible_data_type',
        message: `Column type '${columnInfo.dataType}' is not compatible with target types: ${target.acceptedTypes.join(', ')}`,
      }
    }

    // 2. Nullable constraints
    if (target.isRequired && columnInfo.nullable) {
      return {
        isValid: false,
        reason: 'nullable_required_field',
        message: 'Required field cannot accept nullable column',
      }
    }

    // 3. Length constraints for labels and aliases
    if (target.type === 'label' || target.type === 'alias') {
      const maxLength = target.type === 'label' ? 250 : 100
      const hasLongValues = columnInfo.sampleValues?.some((val) => val.length > maxLength)
      if (hasLongValues) {
        return {
          isValid: false,
          reason: 'length_constraint',
          message: `${target.type} values should be shorter than ${maxLength} characters`,
        }
      }
    }

    // 4. Property requirements for statements, qualifiers, references
    if (['statement', 'qualifier', 'reference'].includes(target.type) && !target.propertyId) {
      return {
        isValid: false,
        reason: 'missing_property_id',
        message: `${target.type} target must have a property ID`,
      }
    }

    return { isValid: true }
  }

  /**
   * Check if a column would be a duplicate alias
   */
  const isAliasDuplicate = (
    columnInfo: ColumnInfo,
    existingAliases: Array<{ columnName: string; dataType: string }>,
  ): boolean => {
    return existingAliases.some(
      (alias) => alias.columnName === columnInfo.name && alias.dataType === columnInfo.dataType,
    )
  }

  /**
   * Validate column for styling purposes (consistent across all term types)
   */
  const validateForStyling = (columnInfo: ColumnInfo, target: DropTarget): CoreValidationResult => {
    // For styling, we don't check duplicates - aliases should show green even for duplicates
    return validateColumnForTarget(columnInfo, target)
  }

  /**
   * Validate column for drop purposes (includes duplicate checking for aliases)
   */
  const validateForDrop = (
    columnInfo: ColumnInfo,
    target: DropTarget,
    existingAliases?: Array<{ columnName: string; dataType: string }>,
  ): CoreValidationResult => {
    // First check basic validation
    const basicValidation = validateColumnForTarget(columnInfo, target)
    if (!basicValidation.isValid) {
      return basicValidation
    }

    // For aliases, also check duplicates
    if (target.type === 'alias' && existingAliases) {
      if (isAliasDuplicate(columnInfo, existingAliases)) {
        return {
          isValid: false,
          reason: 'duplicate_alias',
          message: 'This alias already exists',
        }
      }
    }

    return { isValid: true }
  }

  return {
    validateColumnForTarget,
    validateForStyling,
    validateForDrop,
    isAliasDuplicate,
  }
}
