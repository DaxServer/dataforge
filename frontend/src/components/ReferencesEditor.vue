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
}

const emit = defineEmits<ReferencesEditorEmits>()

// Local state for adding new reference
const isAddingReference = ref(false)
const selectedValue = ref<ValueMapping | null>(null)

// Computed properties
const references = computed(() => props.references || [])

const hasReferences = computed(() => references.value.length > 0)

const shouldShowEmptyState = computed(() => !hasReferences.value && !isAddingReference.value)

// Use existing property selection composable
const { selectedProperty, selectProperty, clearSelection } = usePropertySelection()

// Use existing value type options from StatementEditor composable
const { valueTypeOptions } = useStatementEditor()

// Common referenroperties for suggestions
const commonReferenceProperties = [
  { id: 'P248', label: 'stated in', dataType: 'wikibase-item' },
  { id: 'P854', label: 'reference URL', dataType: 'url' },
  { id: 'P813', label: 'retrieved', dataType: 'time' },
  { id: 'P577', label: 'publication date', dataType: 'time' },
  { id: 'P50', label: 'author', dataType: 'wikibase-item' },
]

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

const canAddReference = computed(
  () =>
    isValidReferenceProperty(selectedProperty.value) && isValidReferenceValue(selectedValue.value),
)

// Methods
const startAddingReference = () => {
  isAddingReference.value = true
  clearSelection()
  selectedValue.value = null
}

const cancelAddingReference = () => {
  isAddingReference.value = false
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

  // Use existing data type compatibility logic
  const { getCompatibleWikibaseTypes } = useDataTypeCompatibility()
  const compatibleTypes = getCompatibleWikibaseTypes(columnInfo.dataType)
  const suggestedDataType = compatibleTypes[0] || 'string'

  selectedValue.value = {
    type: 'column',
    source: {
      columnName: columnInfo.name,
      dataType: columnInfo.dataType,
    },
    dataType: suggestedDataType,
  }
}

const addReference = () => {
  if (!canAddReference.value || !selectedProperty.value || !selectedValue.value) return

  const reference: ReferenceSchemaMapping = {
    property: selectedProperty.value,
    value: selectedValue.value,
  }

  emit('add-reference', props.statementId, reference)
  cancelAddingReference()
}

const removeReference = (referenceIndex: number) => {
  emit('remove-reference', props.statementId, referenceIndex)
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
      class="space-y-2"
      data-testid="references-list"
    >
      <!-- References Display Container -->
      <div
        class="border-l-4 border-orange-200 pl-4 bg-gradient-to-r from-orange-25 to-transparent"
      >
        <div class="space-y-3">
          <!-- References Header -->
          <div class="flex items-center gap-2 text-sm font-medium text-orange-700 mb-3">
            <i class="pi pi-angle-right text-xs" />
            <span>Statement references</span>
          </div>

          <!-- Individual References -->
          <div
            v-for="(reference, index) in references"
            :key="`reference-${index}`"
            class="relative"
            data-testid="reference-item"
          >
            <!-- Connector Line -->
            <div class="absolute left-0 top-0 bottom-0 w-px bg-orange-200" />

            <!-- Reference Content -->
            <div
              class="flex items-center justify-between p-3 ml-4 bg-surface-50 border border-surface-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div class="flex items-center gap-3 flex-1">
                <!-- Reference Indicator -->
                <div class="flex items-center gap-1 text-orange-600">
                  <i class="pi pi-angle-right text-xs" />
                  <span class="text-xs font-medium">{{ getReferenceNumber(index) }}</span>
                </div>

                <!-- Property Info -->
                <div
                  class="flex items-center gap-2"
                  data-testid="reference-property"
                >
                  <Tag
                    :value="reference.property.id"
                    size="small"
                    severity="info"
                  />
                  <span class="font-medium text-surface-900">
                    {{ getPropertyDisplayText(reference.property) }}
                  </span>
                </div>

                <!-- Relationship Arrow -->
                <i class="pi pi-arrow-right text-surface-400 text-sm" />

                <!-- Value Info -->
                <div
                  class="flex items-center gap-2"
                  data-testid="reference-value"
                >
                  <i
                    :class="getValueTypeIcon(reference.value.type)"
                    class="text-surface-600 text-sm"
                  />
                  <Tag
                    :value="getValueDisplayText(reference.value)"
                    size="small"
                    severity="secondary"
                  />
                  <span class="text-xs text-surface-500">
                    {{ reference.value.dataType }}
                  </span>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-1">
                <Button
                  v-tooltip="'Remove reference'"
                  icon="pi pi-trash"
                  size="small"
                  severity="danger"
                  text
                  :disabled="disabled"
                  data-testid="remove-reference-button"
                  @click="removeReference(index)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Reference Form -->
    <div
      v-if="isAddingReference"
      class="border border-surface-200 rounded-lg p-4 bg-surface-25 space-y-4"
    >
      <div class="flex items-center justify-between mb-4">
        <h5 class="font-medium text-surface-900">Add New Reference</h5>
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
          placeholder="Search for a reference property (e.g., P248, P854, P813)..."
          :disabled="disabled"
          @update="handlePropertyChange"
        />

        <!-- Common reference properties suggestions -->
        <div class="flex flex-wrap gap-1 mt-2">
          <Button
            v-for="commonProp in commonReferenceProperties"
            :key="commonProp.id"
            :label="`${commonProp.id} - ${commonProp.label}`"
            size="small"
            severity="secondary"
            text
            class="text-xs"
            @click="handlePropertyChange(commonProp as PropertyReference)"
          />
        </div>
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
          <InputText
            v-else-if="selectedValue"
            v-model="selectedValue.source"
            :placeholder="
              selectedValue.type === 'constant' ? 'Enter constant value...' : 'Enter expression...'
            "
            class="w-full"
          />
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
          label="Add Reference"
          :disabled="!canAddReference"
          size="small"
          @click="addReference"
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
        </div>
        <div class="text-xs text-surface-400 mt-2">
          Common reference properties: P248 (stated in), P854 (reference URL), P813 (retrieved)
        </div>
      </div>
    </div>
  </div>
</template>
