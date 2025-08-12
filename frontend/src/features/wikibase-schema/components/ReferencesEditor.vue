<script setup lang="ts">
// Props
interface ReferencesEditorProps {
  statementId: UUID
  references?: ReferenceSchemaMapping[]
  availableColumns?: ColumnInfo[]
  disabled?: boolean
}

const props = withDefaults(defineProps<ReferencesEditorProps>(), {
  references: () => [],
  availableColumns: () => [],
  disabled: false,
})

// Emits
interface ReferencesEditorEmits {
  'add-reference': [statementId: UUID, reference: ReferenceSchemaMapping]
  'remove-reference': [statementId: UUID, referenceIndex: number]
  'update-reference': [statementId: UUID, referenceIndex: number, reference: ReferenceSchemaMapping]
  'add-snak-to-reference': [statementId: UUID, referenceIndex: number, snak: PropertyValueMap]
  'remove-snak-from-reference': [statementId: UUID, referenceIndex: number, snakIndex: number]
}

const emit = defineEmits<ReferencesEditorEmits>()

// Local state for adding new reference
const isAddingReference = ref(false)
const isAddingSnakToReference = ref<number | null>(null) // Index of reference we're adding a snak to
const selectedPropertyId = ref('')
const selectedValue = ref<ValueMapping | null>(null)
const validationErrors = ref<string[]>([])

// Computed properties
const references = computed(() => props.references || [])

const shouldShowEmptyState = computed(
  () => references.value.length === 0 && !isAddingReference.value,
)

const { clearSelection } = usePropertySelection()

// Methods
const startAddingReference = () => {
  isAddingReference.value = true
  isAddingSnakToReference.value = null
  clearSelection()
  selectedPropertyId.value = ''
  selectedValue.value = null
}

const startAddingSnakToReference = (referenceIndex: number) => {
  isAddingSnakToReference.value = referenceIndex
  isAddingReference.value = false
  clearSelection()
  selectedPropertyId.value = ''
  selectedValue.value = null
}

const cancelAddingReference = () => {
  isAddingReference.value = false
  isAddingSnakToReference.value = null
  clearSelection()
  selectedPropertyId.value = ''
  selectedValue.value = null
}

const handleReferenceSubmit = () => {
  if (!selectedPropertyId.value || !selectedValue.value) return

  // Find the property by ID
  const property = {
    id: selectedPropertyId.value,
    dataType: selectedValue.value.dataType,
    label: '',
  } as PropertyReference

  const snak: PropertyValueMap = {
    property,
    value: selectedValue.value,
  }

  if (isAddingReference.value) {
    // Create a new reference with the first snak
    const reference: ReferenceSchemaMapping = {
      id: crypto.randomUUID(),
      snaks: [snak],
    }
    emit('add-reference', props.statementId, reference)
  } else if (isAddingSnakToReference.value !== null) {
    // Add snak to existing reference
    emit('add-snak-to-reference', props.statementId, isAddingSnakToReference.value, snak)
  }

  cancelAddingReference()
}

const removeReference = (referenceIndex: number) => {
  emit('remove-reference', props.statementId, referenceIndex)
}

const removeSnakFromReference = (referenceIndex: number, snakIndex: number) => {
  emit('remove-snak-from-reference', props.statementId, referenceIndex, snakIndex)
}

const getValueTypeIcon = (valueType: string): string => {
  const icons = {
    column: 'pi pi-database',
    constant: 'pi pi-tag',
    expression: 'pi pi-code',
  }
  return icons[valueType as keyof typeof icons] || 'pi pi-question'
}

const getReferenceNumber = (index: number): string => `R${index + 1}`

const getPropertyDisplayText = (property: PropertyReference): string => {
  return property.label || property.id
}

const getValueDisplayText = (value: ValueMapping): string => {
  if (value.type === 'column') {
    return typeof value.source === 'string' ? value.source : value.source.columnName
  }
  return typeof value.source === 'string' ? value.source : 'No mapping'
}

const getSnakNumber = (referenceIndex: number, snakIndex: number): string =>
  `R${referenceIndex + 1}.${snakIndex + 1}`
</script>

<template>
  <div class="references-editor space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <i class="pi pi-bookmark text-surface-600" />
        <h4 class="text-md font-medium text-surface-900">
          References
          <span
            v-if="references.length > 0"
            class="text-sm text-surface-500 font-normal"
          >
            ({{ references.length }})
          </span>
        </h4>
      </div>

      <Button
        v-if="!isAddingReference"
        icon="pi pi-plus"
        label="Add Reference"
        size="small"
        severity="secondary"
        :disabled="disabled"
        @click="startAddingReference"
      />
    </div>

    <!-- Existing References List -->
    <div
      v-if="references.length > 0"
      class="space-y-4"
      data-testid="references-list"
    >
      <!-- Individual References -->
      <div
        v-for="(reference, referenceIndex) in references"
        :key="`reference-${reference.id}`"
        class="border-l-4 border-orange-200 pl-4 bg-gradient-to-r from-orange-25 to-transparent rounded-r-lg"
        data-testid="reference-item"
      >
        <div class="space-y-3 py-3">
          <!-- Reference Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-sm font-medium text-orange-700">
              <i class="pi pi-bookmark text-xs" />
              <span>{{ getReferenceNumber(referenceIndex) }}</span>
              <span class="text-xs text-surface-500 font-normal">
                ({{ reference.snaks.length }}
                {{ reference.snaks.length === 1 ? 'property' : 'properties' }})
              </span>
            </div>

            <div class="flex items-center gap-1">
              <Button
                v-tooltip="'Add property to this reference'"
                icon="pi pi-plus"
                size="small"
                severity="secondary"
                text
                :disabled="disabled"
                @click="startAddingSnakToReference(referenceIndex)"
              />
              <Button
                v-tooltip="'Remove entire reference'"
                icon="pi pi-trash"
                size="small"
                severity="danger"
                text
                :disabled="disabled"
                data-testid="remove-reference-button"
                @click="removeReference(referenceIndex)"
              />
            </div>
          </div>

          <!-- Reference Snaks (Property-Value Pairs) -->
          <div class="space-y-2 ml-4">
            <div
              v-for="(snak, snakIndex) in reference.snaks"
              :key="`snak-${referenceIndex}-${snakIndex}`"
              class="flex items-center justify-between p-3 bg-surface-50 border border-surface-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              data-testid="reference-snak"
            >
              <div class="flex items-center gap-3 flex-1">
                <!-- Snak Indicator -->
                <div class="flex items-center gap-1 text-orange-600">
                  <i class="pi pi-angle-right text-xs" />
                  <span class="text-xs font-medium">
                    {{ getSnakNumber(referenceIndex, snakIndex) }}
                  </span>
                </div>

                <!-- Property Info -->
                <div
                  class="flex items-center gap-2"
                  data-testid="snak-property"
                >
                  <Tag
                    :value="snak.property.id"
                    size="small"
                    severity="info"
                  />
                  <span class="font-medium text-surface-900">
                    {{ getPropertyDisplayText(snak.property) }}
                  </span>
                </div>

                <!-- Relationship Arrow -->
                <i class="pi pi-arrow-right text-surface-400 text-sm" />

                <!-- Value Info -->
                <div
                  class="flex items-center gap-2"
                  data-testid="snak-value"
                >
                  <i
                    :class="getValueTypeIcon(snak.value.type)"
                    class="text-surface-600 text-sm"
                  />
                  <Tag
                    :value="getValueDisplayText(snak.value)"
                    size="small"
                    severity="secondary"
                  />
                  <span class="text-xs text-surface-500">
                    {{ snak.value.dataType }}
                  </span>
                </div>
              </div>

              <!-- Snak Actions -->
              <div class="flex items-center gap-1">
                <Button
                  v-tooltip="'Remove this property from reference'"
                  icon="pi pi-times"
                  size="small"
                  severity="danger"
                  text
                  :disabled="disabled"
                  data-testid="remove-snak-button"
                  @click="removeSnakFromReference(referenceIndex, snakIndex)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Reference/Snak Form -->
    <div
      v-if="isAddingReference || isAddingSnakToReference !== null"
      class="border border-surface-200 rounded-lg p-4 bg-surface-25"
    >
      <div class="flex items-center justify-between mb-4">
        <h5 class="font-medium text-surface-900">
          {{
            isAddingReference
              ? 'Add New Reference'
              : `Add Property to ${getReferenceNumber(isAddingSnakToReference!)}`
          }}
        </h5>
        <!-- Action buttons -->
        <div class="flex justify-end gap-2 mt-4">
          <Button
            label="Cancel"
            severity="secondary"
            outlined
            @click="cancelAddingReference"
          />
          <Button
            :label="isAddingReference ? 'Add Reference' : 'Add Property'"
            :disabled="!selectedPropertyId || !selectedValue || validationErrors.length > 0"
            @click="handleReferenceSubmit"
          />
        </div>
      </div>

      <PropertyValueMappingEditor
        v-model:property-id="selectedPropertyId"
        v-model:value-mapping="selectedValue"
        validation-path="reference"
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
      data-testid="references-empty-state"
    >
      <div class="space-y-3">
        <div class="text-surface-400">
          <i class="pi pi-bookmark text-3xl" />
        </div>
        <div class="space-y-1">
          <h5 class="text-md font-medium text-surface-600">No references configured</h5>
          <p class="text-sm text-surface-500">
            Add references to cite sources and provide provenance for this statement
          </p>
          <p class="text-xs text-surface-400 mt-2">
            Each reference can contain multiple property-value pairs
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
