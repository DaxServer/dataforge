import { computed } from 'vue'
import { useSchemaStore } from '@frontend/stores/schema.store'
import { useValidationStore } from '@frontend/stores/validation.store'

export interface SchemaCompletenessResult {
  isComplete: boolean
  missingRequiredFields: string[]
  requiredFieldHighlights: RequiredFieldHighlight[]
}

export interface RequiredFieldHighlight {
  path: string
  message: string
  severity: 'error' | 'warning'
  component?: string
}

/**
 * Composable for validating schema completeness and highlighting required fields
 */
export const useSchemaCompletenessValidation = () => {
  const schemaStore = useSchemaStore()
  const validationStore = useValidationStore()

  /**
   * Get the value for a specific field path from the schema store
   */
  const getFieldValue = (fieldPath: string): unknown => {
    switch (fieldPath) {
      case 'schema.name':
        return schemaStore.schemaName

      case 'schema.wikibase':
        return schemaStore.wikibase

      case 'item.terms.labels':
        return schemaStore.labels

      case 'item.terms.descriptions':
        return schemaStore.descriptions

      case 'item.terms.aliases':
        return schemaStore.aliases

      case 'item.statements':
        return schemaStore.statements

      default:
        return null
    }
  }

  /**
   * Check if a specific required field is satisfied using configurable rules
   */
  const isFieldSatisfied = (fieldPath: string): boolean => {
    const rules = validationStore.getRulesByFieldPath(fieldPath)
    if (rules.length === 0) return true

    const fieldValue = getFieldValue(fieldPath)
    const context = { schemaStore }

    return rules.every((rule) => rule.validator(fieldValue, context))
  }

  /**
   * Get all missing required fields based on configurable rules
   */
  const getMissingRequiredFields = (): string[] => {
    const missingFields: string[] = []

    // Check all enabled validation rules
    for (const rule of validationStore.enabledRules) {
      if (!isFieldSatisfied(rule.fieldPath)) {
        missingFields.push(rule.fieldPath)
      }
    }

    // Check for incomplete statements (dynamic validation)
    schemaStore.statements.forEach((statement, index) => {
      if (!statement.property.id) {
        missingFields.push(`item.statements[${index}].property.id`)
      }

      if (statement.value.type === 'column' && !statement.value.source.columnName.trim()) {
        missingFields.push(`item.statements[${index}].value.source.columnName`)
      }

      if (
        statement.value.type === 'constant' &&
        typeof statement.value.source === 'string' &&
        !statement.value.source.trim()
      ) {
        missingFields.push(`item.statements[${index}].value.source`)
      }
    })

    return missingFields
  }

  /**
   * Check if the schema is considered complete
   */
  const isSchemaComplete = (): boolean => {
    const missingFields = getMissingRequiredFields()
    return missingFields.length === 0
  }

  /**
   * Check if the schema has any content (not completely empty)
   */
  const hasSchemaContent = (): boolean => {
    return (
      schemaStore.schemaName.trim().length > 0 ||
      schemaStore.wikibase.trim().length > 0 ||
      Object.keys(schemaStore.labels).length > 0 ||
      Object.keys(schemaStore.descriptions).length > 0 ||
      Object.keys(schemaStore.aliases).length > 0 ||
      schemaStore.statements.length > 0
    )
  }

  /**
   * Get highlights for required fields that need attention using configurable rules
   * Only shows errors if the schema has some content (not completely empty)
   */
  const getRequiredFieldHighlights = (): RequiredFieldHighlight[] => {
    const highlights: RequiredFieldHighlight[] = []

    // Don't show validation errors for completely empty schemas
    if (!hasSchemaContent()) {
      return highlights
    }

    const missingFields = getMissingRequiredFields()

    for (const fieldPath of missingFields) {
      // Find the corresponding rule
      const rule = validationStore.enabledRules.find((r) => r.fieldPath === fieldPath)

      if (rule) {
        highlights.push({
          path: fieldPath,
          message: rule.message,
          severity: rule.severity,
          component: getComponentForField(fieldPath),
        })
      } else if (fieldPath.includes('statements[')) {
        // Handle statement-specific missing fields (dynamic validation)
        highlights.push({
          path: fieldPath,
          message: getStatementFieldMessage(fieldPath),
          severity: 'error',
          component: 'StatementEditor',
        })
      }
    }

    return highlights
  }

  /**
   * Get the component name responsible for a field
   */
  const getComponentForField = (fieldPath: string): string => {
    if (fieldPath.startsWith('schema.')) {
      return 'WikibaseSchemaEditor'
    } else if (fieldPath.includes('terms.labels')) {
      return 'TermsEditor'
    } else if (fieldPath.includes('statements')) {
      return 'StatementEditor'
    }
    return 'WikibaseSchemaEditor'
  }

  /**
   * Get appropriate message for statement field errors
   */
  const getStatementFieldMessage = (fieldPath: string): string => {
    if (fieldPath.includes('property.id')) {
      return 'Statement property ID is required'
    } else if (fieldPath.includes('value.source.columnName')) {
      return 'Statement value column mapping is required'
    } else if (fieldPath.includes('value.source')) {
      return 'Statement value is required'
    }
    return 'Statement configuration is incomplete'
  }

  /**
   * Validate complete schema and return comprehensive result
   */
  const validateSchemaCompleteness = (): SchemaCompletenessResult => {
    const missingRequiredFields = getMissingRequiredFields()
    const isComplete = missingRequiredFields.length === 0
    const requiredFieldHighlights = getRequiredFieldHighlights()

    return {
      isComplete,
      missingRequiredFields,
      requiredFieldHighlights,
    }
  }

  // Reactive computed properties
  const missingRequiredFields = computed(() => getMissingRequiredFields())
  const requiredFieldHighlights = computed(() => getRequiredFieldHighlights())
  const isComplete = computed(() => isSchemaComplete())

  return {
    // Methods
    validateSchemaCompleteness,
    getMissingRequiredFields,
    getRequiredFieldHighlights,
    isSchemaComplete,
    isFieldSatisfied,
    hasSchemaContent,

    // Reactive computed properties
    missingRequiredFields,
    requiredFieldHighlights,
    isComplete,
  }
}
