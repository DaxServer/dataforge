import type { WikibaseDataType } from '@backend/types/wikibase-schema'
import { useDataTypeCompatibility } from '@frontend/features/data-processing/composables/useDataTypeCompatibility'
import { useDragDropStore } from '@frontend/features/data-processing/stores/drag-drop.store'
import { useValidationCore } from '@frontend/features/wikibase-schema/composables/useValidationCore'
import { useValidationErrors } from '@frontend/features/wikibase-schema/composables/useValidationErrors'
import { useValidationStore } from '@frontend/features/wikibase-schema/stores/validation.store'
import type { DropFeedback, DropTarget } from '@frontend/shared/types/drag-drop'
import type {
  ColumnInfo,
  ValidationError,
  ValidationResult,
} from '@frontend/shared/types/wikibase-schema'
import { computed, ref, watch } from 'vue'

interface MappingInfo {
  path: string
  columnName: string
  columnDataType?: string
  targetTypes?: WikibaseDataType[]
  language?: string
  propertyId?: string
}

interface DragValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

/**
 * Composable for validation during drag-and-drop operations
 * Provides immediate feedback and validation as users interact with the schema editor
 * Validation is always active and triggers on dragstart events
 */
export const useValidation = () => {
  const dragDropStore = useDragDropStore()
  const validationStore = useValidationStore()
  const { createError } = useValidationErrors()
  const { validateColumnForTarget } = useValidationCore()
  const { isDataTypeCompatible } = useDataTypeCompatibility()

  // Local reactive state
  const validationFeedback = ref<DropFeedback | null>(null)

  // Computed property for current drag operation validity
  const isValidDragOperation = computed(() => {
    if (!dragDropStore.draggedColumn || !dragDropStore.hoveredTarget) {
      return false
    }

    const target = dragDropStore.availableTargets.find(
      (t) => t.path === dragDropStore.hoveredTarget,
    )
    if (!target) return false

    const validation = validateDragOperation(dragDropStore.draggedColumn, target)
    return validation.isValid
  })

  /**
   * Validate a single drag operation between a column and target
   */
  const validateDragOperation = (
    columnInfo: ColumnInfo,
    target: DropTarget,
    autoAddToStore = false,
  ): DragValidationResult => {
    // Clear previous errors for this path if auto-adding to store
    if (autoAddToStore) {
      validationStore.clearErrorsForPath(target.path, true)
    }

    // Use core validation logic
    const validation = validateColumnForTarget(columnInfo, target)

    if (!validation.isValid) {
      const error = createError(
        getErrorCodeFromReason(validation.reason || 'unknown'),
        target.path,
        {
          columnName: columnInfo.name,
          dataType: columnInfo.dataType,
          targetType: target.acceptedTypes.join(', '),
        },
        validation.message || 'Validation failed',
      )

      if (autoAddToStore) {
        validationStore.addError(error)
      }

      return {
        isValid: false,
        errors: [error],
        warnings: [],
      }
    }

    return {
      isValid: validation.isValid,
      errors: [],
      warnings: [],
    }
  }

  /**
   * Map validation reasons to error codes
   */
  const getErrorCodeFromReason = (reason: string) => {
    switch (reason) {
      case 'incompatible_data_type':
        return 'INCOMPATIBLE_DATA_TYPE'
      case 'nullable_required_field':
        return 'MISSING_REQUIRED_MAPPING'
      case 'length_constraint':
        return 'INCOMPATIBLE_DATA_TYPE'
      case 'missing_property_id':
        return 'INVALID_PROPERTY_ID'
      default:
        return 'INCOMPATIBLE_DATA_TYPE'
    }
  }

  /**
   * Detect invalid mappings by comparing with existing mappings
   */
  const detectInvalidMappings = (
    existingMappings: MappingInfo[],
    newMapping: MappingInfo,
  ): ValidationError[] => {
    const errors: ValidationError[] = []

    // Check for duplicate language mappings
    if (newMapping.language) {
      const duplicateLanguage = existingMappings.find(
        (mapping) =>
          mapping.language === newMapping.language &&
          mapping.path === newMapping.path &&
          mapping.columnName !== newMapping.columnName,
      )

      if (duplicateLanguage) {
        errors.push(
          createError('DUPLICATE_LANGUAGE_MAPPING', newMapping.path, {
            columnName: newMapping.columnName,
            languageCode: newMapping.language,
          }),
        )
      }
    }

    // Check for duplicate property mappings
    if (newMapping.propertyId) {
      const duplicateProperty = existingMappings.find(
        (mapping) =>
          mapping.propertyId === newMapping.propertyId &&
          mapping.path !== newMapping.path &&
          (mapping.path.includes('.statements[') ||
            mapping.path.includes('.qualifiers[') ||
            mapping.path.includes('.references[')),
      )

      if (duplicateProperty) {
        errors.push(
          createError('DUPLICATE_PROPERTY_MAPPING', newMapping.path, {
            columnName: newMapping.columnName,
            propertyId: newMapping.propertyId,
          }),
        )
      }
    }

    return errors
  }

  /**
   * Detect missing required mappings
   */
  const detectMissingRequiredMappings = (
    requiredTargets: DropTarget[],
    existingMappings: MappingInfo[],
  ): ValidationError[] => {
    const errors: ValidationError[] = []

    for (const target of requiredTargets) {
      if (!target.isRequired) continue

      const hasMapping = existingMappings.some((mapping) => mapping.path === target.path)

      if (!hasMapping) {
        errors.push(
          createError('MISSING_REQUIRED_MAPPING', target.path, {
            targetType: target.type,
            propertyId: target.propertyId,
            languageCode: target.language,
          }),
        )
      }
    }

    return errors
  }

  /**
   * Validate all mappings for consistency and compatibility
   */
  const validateAllMappings = (mappings: MappingInfo[]): ValidationResult => {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    for (const mapping of mappings) {
      if (mapping.columnDataType && mapping.targetTypes) {
        if (!isDataTypeCompatible(mapping.columnDataType, mapping.targetTypes)) {
          errors.push(
            createError('INCOMPATIBLE_DATA_TYPE', mapping.path, {
              columnName: mapping.columnName,
              dataType: mapping.columnDataType,
              targetType: mapping.targetTypes.join(', '),
            }),
          )
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  // Watch for drag state changes and provide immediate feedback
  // Validation is always active and triggers on dragstart events
  watch(
    [
      () => dragDropStore.draggedColumn,
      () => dragDropStore.hoveredTarget,
      () => dragDropStore.dragState,
    ],
    ([draggedColumn, hoveredTarget, dragState]) => {
      // Clear feedback when not dragging
      if (dragState === 'idle' || !draggedColumn) {
        validationFeedback.value = null
        return
      }

      // Provide feedback when hovering over a target
      if (hoveredTarget && draggedColumn) {
        const target = dragDropStore.availableTargets.find((t) => t.path === hoveredTarget)
        if (target) {
          const validation = validateDragOperation(draggedColumn, target)

          if (validation.isValid) {
            validationFeedback.value = {
              type: 'success',
              message: `Compatible mapping for ${target.type}`,
            }
          } else {
            const primaryError = validation.errors[0]
            validationFeedback.value = {
              type: 'error',
              message: primaryError?.message || 'Invalid mapping',
            }
          }
        }
      } else {
        validationFeedback.value = null
      }
    },
    { immediate: true },
  )

  /**
   * Trigger validation immediately on dragstart event
   * This ensures validation happens synchronously with the dragstart event
   * Note: Assumes the drag store state has already been updated
   */
  const triggerDragStartValidation = (columnInfo: ColumnInfo): void => {
    // Immediately calculate valid drop targets and update validation feedback
    const validTargets = dragDropStore.getValidTargetsForColumn(columnInfo)

    // Clear any previous validation feedback
    validationFeedback.value = null

    // If there are no valid targets, provide immediate feedback
    if (validTargets.length === 0) {
      validationFeedback.value = {
        type: 'warning',
        message: `No compatible drop targets found for ${columnInfo.dataType} column`,
      }
    }
  }

  /**
   * Get validation feedback for a specific column and target combination
   */
  const getValidationFeedback = (
    columnInfo: ColumnInfo,
    target: DropTarget,
  ): DropFeedback | null => {
    const validation = validateDragOperation(columnInfo, target)

    if (validation.isValid) {
      return {
        type: 'success',
        message: `Compatible mapping for ${target.type}`,
      }
    } else {
      const primaryError = validation.errors[0]
      return {
        type: 'error',
        message: primaryError?.message || 'Invalid mapping',
      }
    }
  }

  /**
   * Validate and provide suggestions for improving mappings
   */
  const getValidationSuggestions = (columnInfo: ColumnInfo, target: DropTarget): string[] => {
    const suggestions: string[] = []

    // Data type suggestions
    if (!isDataTypeCompatible(columnInfo.dataType, target.acceptedTypes)) {
      suggestions.push(
        `Consider using a column with data type: ${target.acceptedTypes.join(' or ')}`,
      )
    }

    // Nullable suggestions
    if (target.isRequired && columnInfo.nullable) {
      suggestions.push('Use a non-nullable column for required fields')
    }

    // Target-specific suggestions
    switch (target.type) {
      case 'label':
      case 'alias': {
        const maxLength = target.type === 'label' ? 250 : 100
        const hasLongValues = columnInfo.sampleValues?.some((val) => val.length > maxLength)

        if (hasLongValues) {
          suggestions.push(`Consider using shorter text values (max ${maxLength} characters)`)
        }
        break
      }

      case 'statement':
      case 'qualifier':
      case 'reference': {
        if (!target.propertyId) {
          suggestions.push(`Select a property ID for this ${target.type}`)
        }
        break
      }
    }

    return suggestions
  }

  return {
    // State
    validationFeedback,
    isValidDragOperation,

    // Core validation methods
    validateDragOperation,
    detectInvalidMappings,
    detectMissingRequiredMappings,
    validateAllMappings,

    // Dragstart validation (always active)
    triggerDragStartValidation,

    // Utility methods
    getValidationFeedback,
    getValidationSuggestions,
  }
}
