<script setup lang="ts">
// Props
interface Props {
  snak?: PropertyValueMap
  isEditing?: boolean
  isAddingToReference?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  snak: undefined,
  isEditing: false,
  isAddingToReference: false,
})

// Emits
interface Emits {
  save: [snak: PropertyValueMap]
  cancel: []
}

const emit = defineEmits<Emits>()

// Local state
const selectedPropertyId = ref('')
const selectedValue = ref<ValueMapping | null>(null)
const validationErrors = ref<string[]>([])

const { clearSelection } = usePropertySelection()

// Initialize form with existing snak data if editing
watchEffect(() => {
  if (props.isEditing && props.snak) {
    selectedPropertyId.value = props.snak.property.id
    selectedValue.value = { ...props.snak.value }
  } else {
    clearSelection()
    selectedPropertyId.value = ''
    selectedValue.value = null
  }
})

// Methods
const handleSubmit = () => {
  if (!selectedPropertyId.value || !selectedValue.value) return

  const snak: PropertyValueMap = {
    property: {
      id: selectedPropertyId.value,
      dataType: selectedValue.value.dataType,
    } as PropertyReference,
    value: selectedValue.value,
  }

  emit('save', snak)
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

const formTitle = computed(() => {
  if (props.isEditing) return 'Edit Reference Property'
  if (props.isAddingToReference) return 'Add Property to Reference'
  return 'Add New Reference'
})

const submitButtonLabel = computed(() => {
  if (props.isEditing) return 'Update Property'
  if (props.isAddingToReference) return 'Add Property'
  return 'Add Reference'
})
</script>

<template>
  <div class="single-reference-editor border border-surface-200 rounded-lg p-4 bg-surface-25">
    <div class="flex items-center justify-between mb-4">
      <h5 class="font-medium text-surface-900">
        {{ formTitle }}
      </h5>

      <div class="flex justify-end gap-2">
        <Button
          label="Cancel"
          severity="secondary"
          size="small"
          @click="handleCancel"
        />
        <Button
          :label="submitButtonLabel"
          size="small"
          :disabled="!isFormValid"
          @click="handleSubmit"
        />
      </div>
    </div>

    <!-- Property-Value Mapping Editor -->
    <PropertyValueMappingEditor
      v-model:property-id="selectedPropertyId"
      v-model:value-mapping="selectedValue"
      validation-path="reference"
      @validation-changed="onValidationChanged"
    />
  </div>
</template>
