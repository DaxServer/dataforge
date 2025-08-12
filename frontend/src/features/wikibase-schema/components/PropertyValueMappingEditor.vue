<script setup lang="ts">
// Props
interface PropertyValueMappingEditorProps {
  /** Current property-value mapping */
  modelValue?: PropertyValueMap | null
  /** Property ID for v-model binding */
  propertyId?: string
  /** Value mapping for v-model binding */
  valueMapping?: ValueMapping | null
  /** Available columns for mapping */
  availableColumns?: ColumnInfo[]
  /** Placeholder text for property selector */
  propertyPlaceholder?: string
  /** Whether the editor is disabled */
  disabled?: boolean
  /** Show validation errors */
  showValidation?: boolean
  /** Context for validation (e.g., 'statement', 'qualifier', 'reference') */
  context?: string
  /** Validation path for error context */
  validationPath?: string
}

const props = withDefaults(defineProps<PropertyValueMappingEditorProps>(), {
  modelValue: null,
  propertyId: '',
  valueMapping: null,
  availableColumns: () => [],
  propertyPlaceholder: 'Search for a property...',
  disabled: false,
  showValidation: true,
  context: 'mapping',
  validationPath: '',
})

// Emits
interface PropertyValueMappingEditorEmits {
  'update:modelValue': [value: PropertyValueMap | null]
  'update:propertyId': [value: string]
  'update:valueMapping': [value: ValueMapping | null]
  'property-changed': [property: PropertyReference | null]
  'value-changed': [value: ValueMapping]
  'validation-changed': [isValid: boolean, errors: string[]]
}

const emit = defineEmits<PropertyValueMappingEditorEmits>()

// Composables
const { selectedProperty, selectProperty, clearSelection } = usePropertySelection()
const {
  currentMapping,
  valueTypes,
  isColumnType,
  isConstantType,
  isExpressionType,
  sourceValue,
  isValidMapping,
  updateValueType,
  updateColumnSource,
  updateDataType,
  validateMapping,
  resetMapping,
} = useValueMapping()
const {
  dropZoneClasses,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  handleDrop,
  setOnColumnDrop,
} = useStatementDropZone()

// Local state
const validationErrors = ref<string[]>([])

// Computed properties
const currentPropertyValueMap = computed({
  get: () => props.modelValue,
  set: (value: PropertyValueMap | null) => {
    emit('update:modelValue', value)
  },
})

const isValid = computed(() => {
  if (!selectedProperty.value || !isValidMapping.value) {
    return false
  }
  const validation = validateMapping(currentMapping.value)
  return validation.isValid
})

// Watch for validation changes to update errors
watch(
  [() => currentMapping.value, selectedProperty],
  () => {
    if (selectedProperty.value) {
      const validation = validateMapping(currentMapping.value)
      validationErrors.value = validation.errors
    } else {
      validationErrors.value = []
    }
  },
  { deep: true, immediate: true },
)

// Watchers
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      selectProperty(newValue.property)
      currentMapping.value = { ...newValue.value }
    } else {
      clearSelection()
      resetMapping()
    }
  },
  { immediate: true, deep: true },
)

// Get property lookup functions outside of watch
const { getAllProperties: getAvailableProperties } = usePropertySelection()

// Watch for individual propertyId prop changes
watch(
  () => props.propertyId,
  (newPropertyId) => {
    if (newPropertyId && newPropertyId !== selectedProperty.value?.id) {
      // Find property by ID using the property selection composable
      const property = getAvailableProperties().find((p) => p.id === newPropertyId)
      if (property) {
        selectProperty(property)
      }
    } else if (!newPropertyId) {
      clearSelection()
    }
  },
  { immediate: true },
)

// Watch for individual valueMapping prop changes
watch(
  () => props.valueMapping,
  (newValueMapping) => {
    if (newValueMapping) {
      currentMapping.value = { ...newValueMapping }
    } else {
      resetMapping()
    }
  },
  { immediate: true, deep: true },
)

watch(
  [selectedProperty, currentMapping],
  () => {
    if (selectedProperty.value && isValidMapping.value) {
      const propertyValueMap: PropertyValueMap = {
        property: selectedProperty.value,
        value: { ...currentMapping.value },
      }
      currentPropertyValueMap.value = propertyValueMap
    } else {
      currentPropertyValueMap.value = null
    }
  },
  { deep: true },
)

watch(
  [isValid, validationErrors],
  ([newIsValid, newErrors]) => {
    emit('validation-changed', newIsValid, newErrors)
  },
  { immediate: true, deep: true },
)

// Watch for property changes to emit propertyId updates
watch(
  selectedProperty,
  (newProperty) => {
    const newPropertyId = newProperty?.id || ''
    if (newPropertyId !== props.propertyId) {
      emit('update:propertyId', newPropertyId)
    }
  },
  { immediate: true },
)

// Watch for value mapping changes to emit valueMapping updates
watch(
  currentMapping,
  (newMapping) => {
    if (JSON.stringify(newMapping) !== JSON.stringify(props.valueMapping)) {
      emit('update:valueMapping', { ...newMapping })
    }
  },
  { immediate: true, deep: true },
)

// Methods
const handlePropertyChange = (property: PropertyReference | null) => {
  if (property) {
    selectProperty(property)
    // Auto-suggest data type based on property
    const suggestedDataType = property.dataType as WikibaseDataType
    updateDataType(suggestedDataType)
  } else {
    clearSelection()
  }
  emit('property-changed', property)
}

const handleValueTypeChange = (newType: 'column' | 'constant' | 'expression') => {
  updateValueType(newType)
  emit('value-changed', currentMapping.value)
}

const handleColumnSelection = (columnInfo: ColumnInfo) => {
  if (currentMapping.value.type !== 'column') return

  updateColumnSource(columnInfo)
  emit('value-changed', currentMapping.value)
}

const handleConstantOrExpressionChange = (value: string | undefined) => {
  if (!value) return
  if (currentMapping.value.type === 'column') return

  currentMapping.value.source = value
  emit('value-changed', currentMapping.value)
}

const handleDataTypeChange = (value: string | undefined) => {
  if (value) {
    updateDataType(value as WikibaseDataType)
    emit('value-changed', currentMapping.value)
  }
}

const clearColumnSelection = () => {
  if (currentMapping.value.type === 'column') {
    currentMapping.value.source = {
      columnName: '',
      dataType: 'VARCHAR',
    }
    emit('value-changed', currentMapping.value)
  }
}

// Set up column drop callback
setOnColumnDrop((columnInfo: ColumnInfo) => {
  if (props.disabled || currentMapping.value.type !== 'column') return
  handleColumnSelection(columnInfo)
})

// Reset function for external use
const reset = () => {
  clearSelection()
  resetMapping()
  currentPropertyValueMap.value = null
  validationErrors.value = []
}

// Expose methods for parent components
defineExpose({
  reset,
  isValid,
  validationErrors,
})
</script>

<template>
  <div class="property-value-mapping-editor space-y-4">
    <!-- Property Selection -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-surface-700">
        Property
        <span class="text-red-500">*</span>
      </label>
      <PropertySelector
        :model-value="selectedProperty"
        :placeholder="propertyPlaceholder"
        :disabled="disabled"
        @update="handlePropertyChange"
      />
    </div>

    <!-- Value Configuration -->
    <div
      v-if="selectedProperty"
      class="space-y-4"
    >
      <!-- Value Type Selection -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-surface-700">
          Value Type
          <span class="text-red-500">*</span>
        </label>
        <div class="flex gap-2">
          <Button
            v-for="option in valueTypes"
            :key="option.value"
            :label="option.label"
            :icon="option.icon"
            :severity="currentMapping.type === option.value ? 'primary' : 'secondary'"
            :disabled="disabled"
            size="small"
            @click="handleValueTypeChange(option.value as 'column' | 'constant' | 'expression')"
          />
        </div>
      </div>

      <!-- Value Source Configuration -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-surface-700">
          Value Source
          <span class="text-red-500">*</span>
        </label>

        <!-- Column Drop Zone -->
        <div
          v-if="isColumnType"
          :class="dropZoneClasses"
          class="border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200 ease-in-out"
          @dragover="handleDragOver"
          @dragenter="handleDragEnter"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
        >
          <!-- Show dropped column info if column is selected -->
          <div
            v-if="currentMapping.type === 'column' && currentMapping.source.columnName"
            class="flex items-center justify-center gap-3"
          >
            <div
              class="flex items-center gap-2 bg-white border border-surface-200 rounded px-3 py-2"
            >
              <i class="pi pi-database text-primary-600" />
              <span class="font-medium text-surface-900">
                {{ currentMapping.source.columnName }}
              </span>
              <Tag
                :value="currentMapping.source.dataType"
                size="small"
                severity="secondary"
              />
            </div>
            <Button
              v-tooltip="'Clear column selection'"
              icon="pi pi-times"
              size="small"
              severity="secondary"
              text
              :disabled="disabled"
              @click="clearColumnSelection"
            />
          </div>

          <!-- Show drop zone message if no column selected -->
          <div
            v-else
            class="flex items-center justify-center gap-2 text-surface-600"
          >
            <i class="pi pi-upload" />
            <span class="text-sm font-medium">Drop column here</span>
          </div>
        </div>

        <!-- Constant/Expression Input -->
        <InputText
          v-else-if="isConstantType || isExpressionType"
          :model-value="sourceValue"
          :placeholder="isConstantType ? 'Enter constant value...' : 'Enter expression...'"
          :disabled="disabled"
          class="w-full"
          @update:model-value="handleConstantOrExpressionChange"
        />
      </div>

      <!-- Data Type Selection -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-surface-700">
          Wikibase Data Type
          <span class="text-red-500">*</span>
        </label>
        <Select
          :model-value="currentMapping.dataType"
          :options="[
            { label: 'String', value: 'string' },
            { label: 'Wikibase Item', value: 'wikibase-item' },
            { label: 'Wikibase Property', value: 'wikibase-property' },
            { label: 'Quantity', value: 'quantity' },
            { label: 'Time', value: 'time' },
            { label: 'Globe Coordinate', value: 'globe-coordinate' },
            { label: 'URL', value: 'url' },
            { label: 'External ID', value: 'external-id' },
            { label: 'Monolingual Text', value: 'monolingualtext' },
            { label: 'Commons Media', value: 'commonsMedia' },
          ]"
          option-label="label"
          option-value="value"
          :disabled="disabled"
          placeholder="Select data type"
          class="w-full"
          @update:model-value="handleDataTypeChange"
        />
      </div>
    </div>

    <!-- Validation Errors -->
    <div
      v-if="showValidation && validationErrors.length > 0"
      class="space-y-2"
    >
      <div
        v-for="(error, index) in validationErrors"
        :key="index"
        class="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2"
      >
        <i class="pi pi-exclamation-triangle" />
        <span>{{ error }}</span>
      </div>
    </div>
  </div>
</template>
