<script setup lang="ts">
// Props
interface QualifiersEditorProps {
  statementId: string
  qualifiers?: QualifierSchemaMapping[]
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
  'add-qualifier': [statementId: string, qualifier: QualifierSchemaMapping]
  'remove-qualifier': [statementId: string, qualifierIndex: number]
  'update-qualifier': [
    statementId: string,
    qualifierIndex: number,
    qualifier: QualifierSchemaMapping,
  ]
}

const emit = defineEmits<QualifiersEditorEmits>()

// Composables (none needed for now)

// Local state for adding new qualifier
const isAddingQualifier = ref(false)
const selectedValue = ref<ValueMapping | null>(null)

// Computed properties
const qualifiers = computed(() => props.qualifiers || [])

const hasQualifiers = computed(() => qualifiers.value.length > 0)

const shouldShowEmptyState = computed(() => !hasQualifiers.value && !isAddingQualifier.value)

// Use existing property selection composable
const { selectedProperty, selectProperty, clearSelection } = usePropertySelection()

// Use existing value type options from StatementEditor composable
const { valueTypeOptions } = useStatementEditor()

// Validation
const isValidQualifierProperty = (property: PropertyReference | null): boolean => {
  if (!property) return false
  return property.id.startsWith('P') && property.dataType !== ''
}

const isValidQualifierValue = (value: ValueMapping | null): boolean => {
  if (!value) return false

  if (value.type === 'column') {
    return !!value.source.columnName
  }
  return typeof value.source === 'string' && !!value.source.trim()
}

const canAddQualifier = computed(
  () =>
    isValidQualifierProperty(selectedProperty.value) && isValidQualifierValue(selectedValue.value),
)

// Methods
const startAddingQualifier = () => {
  isAddingQualifier.value = true
  clearSelection()
  selectedValue.value = null
}

const cancelAddingQualifier = () => {
  isAddingQualifier.value = false
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

const addQualifier = () => {
  if (!canAddQualifier.value || !selectedProperty.value || !selectedValue.value) return

  const qualifier: QualifierSchemaMapping = {
    property: selectedProperty.value,
    value: selectedValue.value,
  }

  emit('add-qualifier', props.statementId, qualifier)
  cancelAddingQualifier()
}

const removeQualifier = (qualifierIndex: number) => {
  emit('remove-qualifier', props.statementId, qualifierIndex)
}

const getValueTypeIcon = (valueType: string): string => {
  const option = valueTypeOptions.find((opt) => opt.value === valueType)
  return option?.icon || 'pi pi-question'
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
  <div class="qualifiers-editor space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <i class="pi pi-tags text-surface-600" />
        <h4 class="text-md font-medium text-surface-900">
          Qualifiers
          <span
            v-if="hasQualifiers"
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
      v-if="hasQualifiers"
      class="space-y-2"
    >
      <div
        v-for="(qualifier, index) in qualifiers"
        :key="`qualifier-${index}`"
        class="flex items-center justify-between p-3 bg-surface-50 border border-surface-200 rounded-lg"
      >
        <div class="flex items-center gap-3 flex-1">
          <!-- Property Info -->
          <div class="flex items-center gap-2">
            <Tag
              :value="qualifier.property.id"
              size="small"
              severity="info"
            />
            <span class="font-medium text-surface-900">
              {{ qualifier.property.label || qualifier.property.id }}
            </span>
          </div>

          <!-- Arrow -->
          <i class="pi pi-arrow-right text-surface-400 text-sm" />

          <!-- Value Info -->
          <div class="flex items-center gap-2">
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
            @click="removeQualifier(index)"
          />
        </div>
      </div>
    </div>

    <!-- Add Qualifier Form -->
    <div
      v-if="isAddingQualifier"
      class="border border-surface-200 rounded-lg p-4 bg-surface-25 space-y-4"
    >
      <div class="flex items-center justify-between mb-4">
        <h5 class="font-medium text-surface-900">Add New Qualifier</h5>
        <Button
          icon="pi pi-times"
          size="small"
          severity="secondary"
          text
          @click="cancelAddingQualifier"
        />
      </div>

      <!-- Property Selection -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-surface-700">
          Qualifier Property
          <span class="text-red-500">*</span>
        </label>
        <PropertySelector
          :model-value="selectedProperty"
          placeholder="Search for a qualifier property..."
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
          @click="cancelAddingQualifier"
        />
        <Button
          label="Add Qualifier"
          :disabled="!canAddQualifier"
          size="small"
          @click="addQualifier"
        />
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="shouldShowEmptyState"
      class="text-center py-8 border-2 border-dashed border-surface-200 rounded-lg bg-surface-25"
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
