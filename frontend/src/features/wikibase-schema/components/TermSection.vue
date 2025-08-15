<script setup lang="ts">
// Props
const props = defineProps<{
  title: string
  termType: 'label' | 'description' | 'alias'
  icon: string
  placeholder: string
  testId: string
  validationPath: string
  values: Label | Alias
  sectionIndex: number
}>()

// Store
const schemaStore = useSchemaStore()

// Schema validation UI for section-level validation feedback
const { getPathValidationStatus, getValidationIcon } = useSchemaValidationUI()

// Reactive state
const selectedLanguage = ref('en')

// Get validation status and icon for this term type
const validation = computed(() => getPathValidationStatus(props.validationPath))
const validationIcon = computed(() => getValidationIcon(props.validationPath))

// Compute border and background classes based on validation status
const containerClasses = computed(() => {
  if (validation.value.hasErrors) {
    return 'border-red-300 bg-red-50'
  }

  if (validation.value.hasWarnings) {
    return 'border-yellow-300 bg-yellow-50'
  }

  // Alternating backgrounds for normal state
  const bgClass = props.sectionIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'
  return `border-slate-200 ${bgClass}`
})

// Compute total issues count
const totalIssues = computed(
  () => validation.value.errors.length + validation.value.warnings.length,
)

const hasExistingMappings = computed(() => Object.keys(props.values).length > 0)

// Transform mappings into display format using computed
const mappingDisplayData = computed(() => {
  const items: Array<{
    languageCode: string
    mappings: ColumnMapping[]
    isArray: boolean
  }> = []

  for (const [languageCode, value] of Object.entries(props.values)) {
    const mapping: ColumnMapping[] = Array.isArray(value) ? value : [value]

    items.push({
      languageCode,
      mappings: mapping,
      isArray: props.termType === 'alias',
    })
  }

  return items
})

// Remove mapping actions
const removeMapping = (languageCode: string, mapping: ColumnMapping) => {
  if (props.termType === 'label') {
    schemaStore.removeLabelMapping(languageCode)
  } else if (props.termType === 'description') {
    schemaStore.removeDescriptionMapping(languageCode)
  } else if (props.termType === 'alias') {
    schemaStore.removeAliasMapping(languageCode, mapping)
  }
}

const { getAcceptedLanguages } = useTermsEditor()
const { isDataTypeCompatible } = useDataTypeCompatibility()

const validateColumnDrop = (columnInfo: ColumnInfo) => {
  // 1. Data type compatibility - only string types for schema fields
  if (!isDataTypeCompatible(columnInfo.dataType, ['string'])) {
    return {
      isValid: false,
      reason: 'incompatible_data_type',
      message: `Column type '${columnInfo.dataType}' is not compatible with ${props.termType} fields (string types only)`,
    }
  }

  // 2. Length constraints for labels and aliases
  if (props.termType === 'label' || props.termType === 'alias') {
    const maxLength = props.termType === 'label' ? 250 : 100
    const hasLongValues = columnInfo.sampleValues?.some((val) => val.length > maxLength)
    if (hasLongValues) {
      return {
        isValid: false,
        reason: 'length_constraint',
        message: `${props.termType} values should be shorter than ${maxLength} characters`,
      }
    }
  }

  // 3. Check for duplicate aliases
  if (props.termType === 'alias') {
    const existingAliases = schemaStore.aliases[selectedLanguage.value] || []
    const isDuplicate = existingAliases.some(
      (alias) => alias.columnName === columnInfo.name && alias.dataType === columnInfo.dataType,
    )

    if (isDuplicate) {
      return {
        isValid: false,
        reason: 'duplicate_alias',
        message: 'This alias already exists',
      }
    }
  }

  return { isValid: true }
}

// Handle column drop from DropZone
const handleColumnDrop = (columnInfo: ColumnInfo) => {
  const columnMapping = {
    columnName: columnInfo.name,
    dataType: columnInfo.dataType,
  }

  if (props.termType === 'label') {
    schemaStore.addLabelMapping(selectedLanguage.value, columnMapping)
  } else if (props.termType === 'description') {
    schemaStore.addDescriptionMapping(selectedLanguage.value, columnMapping)
  } else if (props.termType === 'alias') {
    schemaStore.addAliasMapping(selectedLanguage.value, columnMapping)
  }
}
</script>

<template>
  <div
    class="border rounded-lg p-3 shadow-sm"
    :class="containerClasses"
  >
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-lg font-semibold">{{ title }}</h3>
      <div
        v-if="validationIcon"
        class="flex items-center gap-1"
      >
        <i :class="[validationIcon.icon, validationIcon.class]" />
        <span class="text-xs text-surface-600">{{ totalIssues }} issues</span>
      </div>
    </div>
    <div>
      <!-- Existing mappings display -->
      <div
        v-if="hasExistingMappings"
        class="space-y-2 mb-4"
      >
        <div
          v-for="displayItem in mappingDisplayData"
          :key="`${termType}-${displayItem.languageCode}`"
          :data-testid="`${termType}-mapping-${displayItem.languageCode}`"
          class="flex items-center justify-between p-3 bg-white rounded-lg border border-surface-300 shadow-sm"
        >
          <div class="flex items-center space-x-3">
            <Chip
              :label="displayItem.languageCode"
              size="small"
              severity="secondary"
            />
            <div class="flex flex-col space-y-2">
              <div
                v-for="(mapping, index) in displayItem.mappings"
                :key="`${termType}-${displayItem.languageCode}-${index}`"
                class="flex items-center space-x-2"
              >
                <span class="font-medium">{{ mapping.columnName }}</span>
                <span class="text-sm text-surface-600">({{ mapping.dataType }})</span>
                <Button
                  :data-testid="`remove-${termType}-mapping-${displayItem.languageCode}-${index}`"
                  icon="pi pi-times"
                  rounded
                  text
                  severity="danger"
                  size="small"
                  @click="removeMapping(displayItem.languageCode, mapping)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Language selector and drop zone in horizontal layout -->
      <div class="flex gap-3 items-stretch">
        <!-- Language selector -->
        <div class="flex-shrink-0">
          <label class="block text-sm font-medium text-surface-700 mb-2">Language</label>
          <Select
            v-model="selectedLanguage"
            :data-testid="`${termType}-language-selector`"
            :options="getAcceptedLanguages()"
            placeholder="Select"
            class="w-full"
          />
        </div>

        <!-- Drop zone -->
        <div class="flex-1 flex flex-col">
          <label class="block text-sm font-medium text-surface-700 mb-2">&nbsp;</label>
          <DropZone
            :icon="icon"
            :placeholder="placeholder"
            :test-id="testId"
            :accepted-types="['string']"
            :validator="validateColumnDrop"
            @column-dropped="handleColumnDrop"
          />
        </div>
      </div>
    </div>
  </div>
</template>
