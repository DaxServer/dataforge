<script setup lang="ts">
// Props
interface Props {
  statementId: UUID
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

// Use the shared composable
const { selectedPropertyId, selectedValue, isFormValid, cancelEditing, onValidationChanged } =
  usePropertyValueEditor()

// Initialize form with existing snak data if editing
watchEffect(() => {
  if (props.isEditing && props.snak) {
    selectedPropertyId.value = props.snak.property.id
    selectedValue.value = { ...props.snak.value }
  } else {
    cancelEditing()
  }
})

// Methods
const handleSubmit = () => {
  if (!isFormValid.value) return

  const snak: PropertyValueMap = {
    property: {
      id: selectedPropertyId.value,
      dataType: selectedValue.value!.dataType,
    } as PropertyReference,
    value: selectedValue.value!,
  }

  emit('save', snak)
}

const handleCancel = () => {
  emit('cancel')
}

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
      :property-id="selectedPropertyId"
      :value-mapping="selectedValue"
      :statement-id="statementId"
      validation-path="reference"
      @validation-changed="onValidationChanged"
    />
  </div>
</template>
