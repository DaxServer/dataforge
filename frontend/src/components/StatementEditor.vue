<script setup lang="ts">
// Props
interface StatementEditorProps {
  modelValue?: {
    property: PropertyReference | null
    value: ValueMapping
    rank: StatementRank
  }
  availableColumns?: ColumnInfo[]
  disabled?: boolean
}

const props = withDefaults(defineProps<StatementEditorProps>(), {
  modelValue: () => ({
    property: null,
    value: {
      type: 'column',
      source: {
        columnName: '',
        dataType: 'VARCHAR',
      },
      dataType: 'string',
    },
    rank: 'normal',
  }),
  availableColumns: () => [],
  disabled: false,
})

// Emits
interface StatementEditorEmits {
  'update:modelValue': [
    value: {
      property: PropertyReference | null
      value: ValueMapping
      rank: StatementRank
    },
  ]
  save: []
  cancel: []
}

const emit = defineEmits<StatementEditorEmits>()

// Composables
const {
  localStatement,
  valueTypeOptions,
  rankOptions,
  isColumnType,
  sourceLabel,
  sourcePlaceholder,
  sourceValue,
  isValidStatement,
  compatibleDataTypes,
  dataTypeValidationMessage,
  handlePropertyUpdate,
  handleValueTypeChange,
  handleDataTypeChange,
  handleRankChange,
  handleColumnDrop,
  initializeStatement,
  setAvailableColumns,
} = useStatementEditor()

const {
  dropZoneClasses,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  handleDrop,
  setOnColumnDrop,
} = useStatementDropZone()

// Set up the column drop callback
setOnColumnDrop((_column) => {
  handleColumnDrop(_column)
  emitUpdate()
})

// Methods
const emitUpdate = () => {
  emit('update:modelValue', { ...localStatement.value })
}

const handleSave = () => {
  if (isValidStatement.value) {
    emit('save')
  }
}

const handleCancel = () => {
  emit('cancel')
}

// Wrapper methods to emit updates
const handlePropertyUpdateWithEmit = (property: PropertyReference | null) => {
  handlePropertyUpdate(property)
  emitUpdate()
}

const handleValueTypeChangeWithEmit = (newType: 'column' | 'constant' | 'expression') => {
  handleValueTypeChange(newType)
  emitUpdate()
}

const handleDataTypeChangeWithEmit = (newDataType: WikibaseDataType) => {
  handleDataTypeChange(newDataType)
  emitUpdate()
}

const handleRankChangeWithEmit = (newRank: StatementRank) => {
  handleRankChange(newRank)
  emitUpdate()
}

const handleSourceValueChange = (value: string | undefined) => {
  sourceValue.value = value || ''
  emitUpdate()
}

const handleClearColumn = () => {
  if (localStatement.value.value.type === 'column') {
    localStatement.value.value.source = {
      columnName: '',
      dataType: 'VARCHAR',
    }
    emitUpdate()
  }
}

// Watch for external changes
watch(
  () => props.modelValue,
  (newValue) => {
    initializeStatement(newValue)
  },
  { deep: true, immediate: true },
)

// Watch for available columns changes
watch(
  () => props.availableColumns,
  (newColumns) => {
    setAvailableColumns(newColumns)
  },
  { deep: true, immediate: true },
)
</script>

<template>
  <div class="statement-editor space-y-6 p-6 border border-surface-200 rounded-lg bg-surface-50">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h4 class="text-lg font-semibold text-surface-900">Configure Statement</h4>
      <div class="flex items-center gap-2">
        <Button
          label="Cancel"
          severity="secondary"
          size="small"
          @click="handleCancel"
        />
        <Button
          label="Save"
          :disabled="!isValidStatement"
          size="small"
          @click="handleSave"
        />
      </div>
    </div>

    <!-- Property Selection -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-surface-700">
        Property
        <span class="text-red-500">*</span>
      </label>
      <PropertySelector
        :model-value="localStatement.property"
        placeholder="Search for a Wikibase property..."
        :disabled="disabled"
        @update="handlePropertyUpdateWithEmit"
      />
      <div
        v-if="localStatement.property"
        class="text-xs text-surface-600"
      >
        Data Type: {{ localStatement.property.dataType }}
      </div>
    </div>

    <!-- Value Configuration -->
    <div class="space-y-4">
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
            :severity="localStatement.value.type === option.value ? 'primary' : 'secondary'"
            size="small"
            @click="
              handleValueTypeChangeWithEmit(option.value as 'column' | 'constant' | 'expression')
            "
          />
        </div>
      </div>

      <!-- Value Source Configuration -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-surface-700">
          {{ sourceLabel }}
          <span class="text-red-500">*</span>
        </label>

        <!-- Column Selection -->
        <div v-if="isColumnType">
          <!-- Drop Zone for Columns -->
          <div
            :class="dropZoneClasses"
            class="border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200 ease-in-out"
            @dragover="handleDragOver"
            @dragenter="handleDragEnter"
            @dragleave="handleDragLeave"
            @drop="handleDrop"
          >
            <!-- Show dropped column info if column is selected -->
            <div
              v-if="
                localStatement.value.source &&
                typeof localStatement.value.source === 'object' &&
                localStatement.value.source.columnName
              "
              class="flex items-center justify-center gap-3"
            >
              <div
                class="flex items-center gap-2 bg-white border border-surface-200 rounded px-3 py-2"
              >
                <i class="pi pi-database text-primary-600" />
                <span class="font-medium text-surface-900">
                  {{ localStatement.value.source.columnName }}
                </span>
                <Tag
                  :value="localStatement.value.source.dataType"
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
                @click="handleClearColumn"
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
        </div>

        <!-- Constant/Expression Input -->
        <InputText
          v-else
          :model-value="sourceValue"
          :placeholder="sourcePlaceholder"
          class="w-full"
          @update:model-value="handleSourceValueChange"
        />
      </div>

      <!-- Wikibase Data Type Selection -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-surface-700">
          Wikibase Data Type
          <span class="text-red-500">*</span>
        </label>
        <Select
          :model-value="localStatement.value.dataType"
          :options="compatibleDataTypes"
          option-label="label"
          option-value="value"
          placeholder="Select data type..."
          class="w-full"
          @update:model-value="handleDataTypeChangeWithEmit"
        />

        <!-- Data Type Validation Message -->
        <div
          v-if="dataTypeValidationMessage"
          class="flex items-center gap-2 text-sm text-red-600"
        >
          <i class="pi pi-exclamation-triangle" />
          <span>{{ dataTypeValidationMessage }}</span>
        </div>
      </div>
    </div>

    <!-- Statement Rank -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-surface-700">Statement Rank</label>
      <div class="flex gap-2">
        <Button
          v-for="option in rankOptions"
          :key="option.value"
          :label="option.label"
          :icon="option.icon"
          :severity="localStatement.rank === option.value ? 'primary' : 'secondary'"
          size="small"
          @click="handleRankChangeWithEmit(option.value as StatementRank)"
        />
      </div>
    </div>

    <!-- Preview -->
    <div
      v-if="isValidStatement"
      class="border-t border-surface-200 pt-4"
    >
      <h5 class="text-sm font-medium text-surface-700 mb-2">Preview</h5>
      <div class="bg-white border border-surface-200 rounded p-3 text-sm">
        <div class="flex items-center gap-2 mb-1">
          <Tag
            :value="localStatement.property?.id"
            size="small"
            severity="info"
          />
          <span class="font-medium">
            {{ localStatement.property?.label || localStatement.property?.id }}
          </span>
        </div>
        <div class="flex items-center gap-2 text-surface-600 ml-4">
          <i class="pi pi-arrow-right text-xs" />
          <Tag
            :value="
              isColumnType
                ? (localStatement.value.source as any)?.columnName
                : localStatement.value.source
            "
            size="small"
            severity="secondary"
          />
          <span class="text-xs">{{ localStatement.value.dataType }}</span>
          <Tag
            :value="localStatement.rank"
            :severity="rankOptions.find((r) => r.value === localStatement.rank)?.severity"
            size="small"
          />
        </div>
      </div>
    </div>
  </div>
</template>
