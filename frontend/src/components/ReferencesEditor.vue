<script setup lang="ts">
// Props
interface ReferencesEditorProps {
  statementId: string
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
  'add-reference': [statementId: string, reference: ReferenceSchemaMapping]
  'remove-reference': [statementId: string, referenceIndex: number]
  'update-reference': [
    statementId: string,
    referenceIndex: number,
    reference: ReferenceSchemaMapping,
  ]
  'add-snak-to-reference': [
    statementId: string,
    referenceIndex: number,
    snak: ReferenceSnakSchemaMapping,
  ]
  'remove-snak-from-reference': [statementId: string, referenceIndex: number, snakIndex: number]
}

const emit = defineEmits<ReferencesEditorEmits>()

// Local state for adding new reference
const isAddingReference = ref(false)
const isAddingSnakToReference = ref<number | null>(null) // Index of reference we're adding a snak to
const selectedValue = ref<ValueMapping | null>(null)

// Computed properties
const references = computed(() => props.references || [])

const hasReferences = computed(() => references.value.length > 0)

const shouldShowEmptyState = computed(() => !hasReferences.value && !isAddingReference.value)

// Use existing property selection composable
const { selectedProperty, selectProperty, clearSelection } = usePropertySelection()

// Use existing value type options from StatementEditor composable
const { valueTypeOptions } = useStatementEditor()

const {
  createReferenceValueMappingFromColumn,
  validateReferenceMapping,
  isReferenceDataTypeCompatible,
} = useReferenceValueMapping()

// Validation
const isValidReferenceProperty = (property: PropertyReference | null): boolean => {
  if (!property) return false
  return property.id.startsWith('P') && property.dataType !== ''
}

const isValidReferenceValue = (value: ValueMapping | null): boolean => {
  if (!value) return false

  if (value.type === 'column') {
    return typeof value.source === 'object' && !!value.source.columnName
  }
  return typeof value.source === 'string' && !!value.source.trim()
}

const canAddSnak = computed(
  () =>
    isValidReferenceProperty(selectedProperty.value) && isValidReferenceValue(selectedValue.value),
)

// Methods
const startAddingReference = () => {
  isAddingReference.value = true
  isAddingSnakToReference.value = null
  clearSelection()
  selectedValue.value = null
}

const startAddingSnakToReference = (referenceIndex: number) => {
  isAddingSnakToReference.value = referenceIndex
  isAddingReference.value = false
  clearSelection()
  selectedValue.value = null
}

const cancelAddingReference = () => {
  isAddingReference.value = false
  isAddingSnakToReference.value = null
  clearSelection()
  selectedValue.value = null
}

const handlePropertyChange = (property: PropertyReference | null) => {
  // Reset value when property changes and auto-suggest data type
  if (property) {
    selectProperty(property)
    selectedValue.value = {
      type: 'column',
      source: { columnName: '', dataType: 'VARCHAR' },
      dataType: property.dataType as WikibaseDataType,
    }
  } else {
    selectedValue.value = null
  }
}

const handleValueTypeChange = (newType: 'column' | 'constant' | 'expression') => {
  if (!selectedValue.value || !selectedProperty.value) return

  const currentDataType = selectedValue.value.dataType

  if (newType === 'column') {
    selectedValue.value = {
      type: 'column',
      source: { columnName: '', dataType: 'VARCHAR' },
      dataType: currentDataType,
    }
  } else {
    selectedValue.value = {
      type: newType,
      source: '',
      dataType: currentDataType,
    }
  }
}

const handleColumnDrop = (columnInfo: ColumnInfo) => {
  if (!selectedProperty.value) return

  // Use enhanced reference value mapping for better citation data support
  selectedValue.value = createReferenceValueMappingFromColumn(
    columnInfo,
    selectedProperty.value.dataType,
  )
}

const addReference = () => {
  if (!canAddSnak.value || !selectedProperty.value || !selectedValue.value) return

  // Create a new reference with the first snak
  const snak: ReferenceSnakSchemaMapping = {
    property: selectedProperty.value,
    value: selectedValue.value,
  }

  const reference: ReferenceSchemaMapping = {
    id: crypto.randomUUID(),
    snaks: [snak],
  }

  emit('add-reference', props.statementId, reference)
  cancelAddingReference()
}

const addSnakToReference = () => {
  if (
    !canAddSnak.value ||
    !selectedProperty.value ||
    !selectedValue.value ||
    isAddingSnakToReference.value === null
  )
    return

  const snak: ReferenceSnakSchemaMapping = {
    property: selectedProperty.value,
    value: selectedValue.value,
  }

  emit('add-snak-to-reference', props.statementId, isAddingSnakToReference.value, snak)
  cancelAddingReference()
}

const removeReference = (referenceIndex: number) => {
  emit('remove-reference', props.statementId, referenceIndex)
}

const removeSnakFromReference = (referenceIndex: number, snakIndex: number) => {
  emit('remove-snak-from-reference', props.statementId, referenceIndex, snakIndex)
}

const getValueTypeIcon = (valueType: string): string => {
  const option = valueTypeOptions.find((opt) => opt.value === valueType)
  return option?.icon || 'pi pi-question'
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

// Drop zone handlers for column mapping using the same pattern as StatementEditor
const {
  dropZoneClasses,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  handleDrop,
  setOnColumnDrop,
} = useStatementDropZone()

// Set up the column drop callback
setOnColumnDrop((columnInfo) => {
  handleColumnDrop(columnInfo)
})
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
            v-if="hasReferences"
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
      v-if="hasReferences"
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
      class="border border-surface-200 rounded-lg p-4 bg-surface-25 space-y-4"
    >
      <div class="flex items-center justify-between mb-4">
        <h5 class="font-medium text-surface-900">
          {{
            isAddingReference
              ? 'Add New Reference'
              : `Add Property to ${getReferenceNumber(isAddingSnakToReference!)}`
          }}
        </h5>
        <Button
          icon="pi pi-times"
          size="small"
          severity="secondary"
          text
          @click="cancelAddingReference"
        />
      </div>

      <!-- Property Selection -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-surface-700">
          Reference Property
          <span class="text-red-500">*</span>
        </label>
        <PropertySelector
          :model-value="selectedProperty"
          placeholder="Search for a reference property..."
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
              v-for="option in valueTypeOptions"
              :key="option.value"
              :label="option.label"
              :icon="option.icon"
              :severity="selectedValue?.type === option.value ? 'primary' : 'secondary'"
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
            v-if="selectedValue?.type === 'column'"
            :class="dropZoneClasses"
            class="border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200 ease-in-out"
            @dragover="handleDragOver"
            @dragenter="handleDragEnter"
            @dragleave="handleDragLeave"
            @drop="handleDrop"
          >
            <!-- Show dropped column info if column is selected -->
            <div
              v-if="selectedValue.source.columnName"
              class="flex items-center justify-center gap-3"
            >
              <div
                class="flex items-center gap-2 bg-white border border-surface-200 rounded px-3 py-2"
              >
                <i class="pi pi-database text-primary-600" />
                <span class="font-medium text-surface-900">
                  {{ selectedValue.source.columnName }}
                </span>
                <Tag
                  :value="selectedValue.source.dataType"
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
                @click="selectedValue.source.columnName = ''"
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
          <div
            v-else-if="selectedValue"
            class="space-y-2"
          >
            <InputText
              v-model="selectedValue.source"
              :placeholder="
                selectedValue.type === 'constant'
                  ? 'Enter constant value...'
                  : 'Enter expression...'
              "
              class="w-full"
            />
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-end gap-2 pt-4 border-t border-surface-200">
        <Button
          label="Cancel"
          severity="secondary"
          size="small"
          @click="cancelAddingReference"
        />
        <Button
          v-if="isAddingReference"
          label="Add Reference"
          :disabled="!canAddSnak"
          size="small"
          @click="addReference"
        />
        <Button
          v-else-if="isAddingSnakToReference !== null"
          label="Add Property"
          :disabled="!canAddSnak"
          size="small"
          @click="addSnakToReference"
        />
      </div>
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
