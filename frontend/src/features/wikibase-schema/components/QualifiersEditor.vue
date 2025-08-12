<script setup lang="ts">
// Props
interface QualifiersEditorProps {
  statementId: UUID
  qualifiers?: PropertyValueMap[]
  availableColumns?: ColumnInfo[]
  disabled?: boolean
}

const props = withDefaults(defineProps<QualifiersEditorProps>(), {
  qualifiers: () => [],
  availableColumns: () => [],
  disabled: false,
})

// Emits
interface QualifiersEditorEmits {
  'add-qualifier': [statementId: UUID, qualifier: PropertyValueMap]
  'remove-qualifier': [statementId: UUID, qualifierIndex: number]
  'update-qualifier': [statementId: UUID, qualifierIndex: number, qualifier: PropertyValueMap]
}

const emit = defineEmits<QualifiersEditorEmits>()

// Local state for adding new qualifier
const isAddingQualifier = ref(false)
const selectedPropertyId = ref('')
const selectedValue = ref<ValueMapping | null>(null)
const validationErrors = ref<string[]>([])

// Computed properties
const qualifiers = computed(() => props.qualifiers || [])

const shouldShowEmptyState = computed(
  () => qualifiers.value.length === 0 && !isAddingQualifier.value,
)

// Methods
const startAddingQualifier = () => {
  isAddingQualifier.value = true
  selectedPropertyId.value = ''
  selectedValue.value = null
}

const cancelAddingQualifier = () => {
  isAddingQualifier.value = false
  selectedPropertyId.value = ''
  selectedValue.value = null
}

const handleQualifierSubmit = () => {
  if (!selectedPropertyId.value || !selectedValue.value) return

  const qualifier: PropertyValueMap = {
    property: {
      id: selectedPropertyId.value,
      dataType: selectedValue.value.dataType,
    },
    value: selectedValue.value,
  }

  emit('add-qualifier', props.statementId, qualifier)
  cancelAddingQualifier()
}

const removeQualifier = (qualifierIndex: number) => {
  emit('remove-qualifier', props.statementId, qualifierIndex)
}

const getValueTypeIcon = (valueType: string): string => {
  const valueTypeOptions = [
    { label: 'Column', value: 'column', icon: 'pi pi-database' },
    { label: 'Constant', value: 'constant', icon: 'pi pi-lock' },
    { label: 'Expression', value: 'expression', icon: 'pi pi-code' },
  ]
  const option = valueTypeOptions.find((opt) => opt.value === valueType)
  return option?.icon || 'pi pi-question'
}

// Drag and drop is now handled by PropertyValueMappingEditor component
</script>

<template>
  <div class="qualifiers-editor space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <i class="pi pi-tags text-surface-600" />
        <h4 class="text-md font-medium text-surface-900">
          Qualifiers
          <span
            v-if="qualifiers.length > 0"
            class="text-sm text-surface-500 font-normal"
          >
            ({{ qualifiers.length }})
          </span>
        </h4>
      </div>

      <Button
        v-if="!isAddingQualifier"
        icon="pi pi-plus"
        label="Add Qualifier"
        size="small"
        severity="secondary"
        :disabled="disabled"
        @click="startAddingQualifier"
      />
    </div>

    <!-- Existing Qualifiers List -->
    <div
      v-if="qualifiers.length > 0"
      class="space-y-2"
      data-testid="qualifiers-list"
    >
      <!-- Qualifiers Display Container -->
      <div
        class="border-l-4 border-primary-200 pl-4 bg-gradient-to-r from-primary-25 to-transparent"
      >
        <div class="space-y-3">
          <!-- Qualifiers Header -->
          <div class="flex items-center gap-2 text-sm font-medium text-primary-700 mb-3">
            <i class="pi pi-angle-right text-xs" />
            <span>Statement qualifiers</span>
          </div>

          <!-- Individual Qualifiers -->
          <div
            v-for="(qualifier, index) in qualifiers"
            :key="`qualifier-${index}`"
            class="relative"
            data-testid="qualifier-item"
          >
            <!-- Connector Line -->
            <div class="absolute left-0 top-0 bottom-0 w-px bg-primary-200" />

            <!-- Qualifier Content -->
            <div
              class="flex items-center justify-between p-3 ml-4 bg-surface-50 border border-surface-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div class="flex items-center gap-3 flex-1">
                <!-- Qualifier Indicator -->
                <div class="flex items-center gap-1 text-primary-600">
                  <i class="pi pi-angle-right text-xs" />
                  <span class="text-xs font-medium">Q{{ index + 1 }}</span>
                </div>

                <!-- Property Info -->
                <div
                  class="flex items-center gap-2"
                  data-testid="qualifier-property"
                >
                  <Tag
                    :value="qualifier.property.id"
                    size="small"
                    severity="info"
                  />
                  <span class="font-medium text-surface-900">
                    {{ qualifier.property.label || qualifier.property.id }}
                  </span>
                </div>

                <!-- Relationship Arrow -->
                <i class="pi pi-arrow-right text-surface-400 text-sm" />

                <!-- Value Info -->
                <div
                  class="flex items-center gap-2"
                  data-testid="qualifier-value"
                >
                  <i
                    :class="getValueTypeIcon(qualifier.value.type)"
                    class="text-surface-600 text-sm"
                  />
                  <Tag
                    :value="
                      qualifier.value.type === 'column'
                        ? qualifier.value.source.columnName
                        : qualifier.value.source
                    "
                    size="small"
                    severity="secondary"
                  />
                  <span class="text-xs text-surface-500">
                    {{ qualifier.value.dataType }}
                  </span>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-1">
                <Button
                  v-tooltip="'Remove qualifier'"
                  icon="pi pi-trash"
                  size="small"
                  severity="danger"
                  text
                  :disabled="disabled"
                  data-testid="remove-qualifier-button"
                  @click="removeQualifier(index)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Qualifier Form -->
    <div
      v-if="isAddingQualifier"
      class="border border-surface-200 rounded-lg p-4 bg-surface-25"
    >
      <div class="flex items-center justify-between mb-4">
        <h5 class="font-medium text-surface-900">Add New Qualifier</h5>

        <div class="flex justify-end gap-2 mt-4">
          <Button
            label="Cancel"
            severity="secondary"
            size="small"
            @click="cancelAddingQualifier"
          />
          <Button
            label="Add Qualifier"
            size="small"
            :disabled="!selectedPropertyId || !selectedValue || validationErrors.length > 0"
            @click="handleQualifierSubmit"
          />
        </div>
      </div>

      <!-- Use the reusable PropertyValueMappingEditor component -->
      <PropertyValueMappingEditor
        v-model:property-id="selectedPropertyId"
        v-model:value-mapping="selectedValue"
        validation-path="qualifier"
        @validation-changed="
          (_, errors) => {
            validationErrors = errors
          }
        "
      />
    </div>

    <!-- Empty State -->
    <div
      v-if="shouldShowEmptyState"
      class="text-center py-8 border-2 border-dashed border-surface-200 rounded-lg bg-surface-25"
      data-testid="qualifiers-empty-state"
    >
      <div class="space-y-3">
        <div class="text-surface-400">
          <i class="pi pi-tags text-3xl" />
        </div>
        <div class="space-y-1">
          <h5 class="text-md font-medium text-surface-600">No qualifiers configured</h5>
          <p class="text-sm text-surface-500">
            Add qualifiers to provide additional context to this statement
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
