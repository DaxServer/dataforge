<script setup lang="ts">
interface Props {
  title: string
  termType: 'label' | 'description' | 'alias'
  icon: string
  placeholder: string
  testId: string
  validationPath: string
  values: Label | Alias
}

const props = defineProps<Props>()
const schemaStore = useSchemaStore()

// Schema validation UI for section-level validation feedback
const { getPathValidationStatus, getValidationIcon } = useSchemaValidationUI()

// Reactive state
const selectedLanguage = ref('en')

// Get validation status and icon for this term type
const validation = computed(() => getPathValidationStatus(props.validationPath))
const validationIcon = computed(() => getValidationIcon(props.validationPath))

// Compute border and background classes based on validation status
const containerClasses = computed(() => [
  'border rounded-lg p-4',
  validation.value.hasErrors
    ? 'border-red-300 bg-red-50'
    : validation.value.hasWarnings
      ? 'border-yellow-300 bg-yellow-50'
      : 'border-surface-200',
])

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
</script>

<template>
  <div :class="containerClasses">
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
          class="flex items-center justify-between p-3 bg-surface-50 rounded-lg border"
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
          <SchemaDropZone
            :term-type="termType"
            :icon="icon"
            :placeholder="placeholder"
            :test-id="testId"
            :language-code="selectedLanguage"
          />
        </div>
      </div>
    </div>
  </div>
</template>
