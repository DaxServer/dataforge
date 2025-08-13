<script setup lang="ts">
// Props
interface Props {
  statementId: UUID
  qualifier?: PropertyValueMap
  isEditing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  qualifier: undefined,
  isEditing: false,
})

// Emits
interface Emits {
  save: [qualifier: PropertyValueMap]
  cancel: []
}

const emit = defineEmits<Emits>()

// Local state
const selectedPropertyId = ref('')
const selectedValue = ref<ValueMapping | null>(null)
const validationErrors = ref<string[]>([])

// Initialize form with existing qualifier data if editing
watchEffect(() => {
  if (props.isEditing && props.qualifier) {
    selectedPropertyId.value = props.qualifier.property.id
    selectedValue.value = { ...props.qualifier.value }
  } else {
    selectedPropertyId.value = ''
    selectedValue.value = null
  }
})

// Methods
const handleSubmit = () => {
  if (!selectedPropertyId.value || !selectedValue.value) return

  const qualifier: PropertyValueMap = {
    property: {
      id: selectedPropertyId.value,
      dataType: selectedValue.value.dataType,
    } as PropertyReference,
    value: selectedValue.value,
  }

  emit('save', qualifier)
}

const handleCancel = () => {
  emit('cancel')
}

const onValidationChanged = (_: any, errors: string[]) => {
  validationErrors.value = errors
}

// Computed
const isFormValid = computed(() => {
  return selectedPropertyId.value && selectedValue.value && validationErrors.value.length === 0
})
</script>

<template>
  <div class="single-qualifier-editor border border-surface-200 rounded-lg p-4 bg-surface-25">
    <div class="flex items-center justify-between mb-4">
      <h5 class="font-medium text-surface-900">
        {{ isEditing ? 'Edit Qualifier' : 'Add New Qualifier' }}
      </h5>

      <div class="flex justify-end gap-2">
        <Button
          label="Cancel"
          severity="secondary"
          size="small"
          @click="handleCancel"
        />
        <Button
          :label="isEditing ? 'Update Qualifier' : 'Add Qualifier'"
          size="small"
          :disabled="!isFormValid"
          @click="handleSubmit"
        />
      </div>
    </div>

    <!-- Property-Value Mapping Editor -->
    <PropertyValueMappingEditor
      :property-id="selectedPropertyId"
      :value-mapping="selectedValue"
      :statement-id="statementId"
      validation-path="qualifier"
      @validation-changed="onValidationChanged"
    />
  </div>
</template>
