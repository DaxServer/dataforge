<script setup lang="ts">
// Props
interface PropertyValueMappingEditorProps {
  statementId: UUID
  propertyValueMap?: PropertyValueMap | null
  propertyPlaceholder?: string
  disabled?: boolean
  showValidation?: boolean
  context?: string
}

const props = withDefaults(defineProps<PropertyValueMappingEditorProps>(), {
  propertyValueMap: null,
  propertyPlaceholder: 'Search for a property...',
  disabled: false,
  showValidation: true,
  context: 'property-value-mapping',
})

// Emits
defineEmits<{
  'property-changed': [property?: PropertyReference]
  'value-changed': [value: ValueMapping]
  'validation-changed': [isValid: boolean, errors: string[]]
}>()

// Composables
const { clearSelection } = usePropertySelection()

// Local state
const validationErrors = ref<string[]>([])

// Computed properties
const isValid = computed(() => {
  // ToDo: Implement validation logic
  // Use props to avoid unused variable warning
  void props
  return true
  // if (!props.propertyValueMap?.value || !isValidMapping.value) {
  //   return false
  // }
  // const validation = validateMapping(currentMapping.value)
  // return validation.isValid
})

// Reset function for external use
const reset = () => {
  clearSelection()
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
      <div class="flex gap-4 items-center">
        <div>
          <PropertySelector
            :property="propertyValueMap?.property"
            :placeholder="propertyPlaceholder"
            :disabled="disabled"
            @update="$emit('property-changed', $event)"
          />
        </div>
        <!-- Data Type Display (Read-only) -->
        <div v-if="propertyValueMap?.property.dataType">
          <div class="flex items-center gap-2 p-2 bg-surface-50 text-sm">
            <i class="pi pi-info-circle text-surface-500" />
            <span class="text-surface-700 font-medium">
              {{ propertyValueMap?.property.dataType }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Value Configuration -->
    <ValueMappingEditor
      v-if="propertyValueMap?.property.dataType"
      :value-mapping="propertyValueMap.value"
      :property-data-type="propertyValueMap.property.dataType as WikibaseDataType"
      :disabled="disabled"
      @value-changed="$emit('value-changed', $event)"
    />

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
