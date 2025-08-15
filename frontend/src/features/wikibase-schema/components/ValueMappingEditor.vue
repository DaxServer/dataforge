<script setup lang="ts">
// Props
interface ValueMappingEditorProps {
  valueMapping?: ValueMapping | null
  propertyDataType?: WikibaseDataType
  disabled?: boolean
  showLabels?: boolean
}

const props = withDefaults(defineProps<ValueMappingEditorProps>(), {
  valueMapping: null,
  propertyDataType: undefined,
  disabled: false,
  showLabels: true,
})

// Emits
const emit = defineEmits<{
  'value-changed': [value: ValueMapping]
}>()

// Composables
const { valueTypes, getCompatibleWikibaseTypes } = useValueMapping()
const {
  dropZoneClasses,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  handleDrop,
  setOnColumnDrop,
} = useStatementDropZone()

// Computed properties
const isColumnType = computed(() => props.valueMapping?.type === 'column')
const isConstantType = computed(() => props.valueMapping?.type === 'constant')
const isExpressionType = computed(() => props.valueMapping?.type === 'expression')

const handleValueTypeChange = (newType: 'column' | 'constant' | 'expression') => {
  let c: ValueMapping
  const dataType: WikibaseDataType = props.propertyDataType ?? 'string'

  if (newType === 'column') {
    c = {
      type: 'column',
      source: { columnName: '', dataType: 'VARCHAR' },
      dataType: 'string',
    }
  } else {
    c = {
      type: newType,
      source: '',
      dataType,
    }
  }

  emit('value-changed', c)
}

const handleColumnSelection = (columnInfo: ColumnInfo) => {
  if (!props.valueMapping || props.valueMapping.type !== 'column') return

  const c: ValueMapping = {
    ...props.valueMapping,
    source: {
      columnName: columnInfo.name,
      dataType: columnInfo.dataType,
    },
  }

  // Auto-suggest compatible data type
  const compatibleTypes = getCompatibleWikibaseTypes(columnInfo.dataType)
  if (compatibleTypes.length > 0 && compatibleTypes[0]) {
    c.dataType = compatibleTypes[0]
  }

  emit('value-changed', c)
}

const handleConstantOrExpressionChange = (value?: string) => {
  if (value === undefined) return
  if (props.valueMapping?.type === 'constant' || props.valueMapping?.type === 'expression') {
    const c = {
      ...props.valueMapping,
      source: value,
    } as ValueMapping

    emit('value-changed', c)
  }
}

const clearColumnSelection = () => {
  if (!props.valueMapping || props.valueMapping.type !== 'column') return

  const c: ValueMapping = {
    ...props.valueMapping,
    source: {
      columnName: '',
      dataType: 'VARCHAR',
    },
  }
  emit('value-changed', c)
}

// Set up column drop callback
setOnColumnDrop((columnInfo: ColumnInfo) => {
  if (props.disabled || props.valueMapping?.type !== 'column') return
  handleColumnSelection(columnInfo)
})
</script>

<template>
  <div class="value-mapping-editor space-y-4">
    <!-- Value Type Selection -->
    <div
      v-if="propertyDataType"
      class="space-y-2"
    >
      <label
        v-if="showLabels"
        class="block text-sm font-medium text-surface-700"
      >
        Value Type
        <span class="text-red-500">*</span>
      </label>
      <div class="flex gap-2">
        <Button
          v-for="option in valueTypes"
          :key="option.value"
          :label="option.label"
          :icon="option.icon"
          :severity="valueMapping?.type === option.value ? 'primary' : 'secondary'"
          :disabled="disabled"
          size="small"
          @click="handleValueTypeChange(option.value as 'column' | 'constant' | 'expression')"
        />
      </div>
    </div>

    <!-- Value Source Configuration -->
    <div
      v-if="propertyDataType && valueMapping?.type"
      class="space-y-2"
    >
      <label
        v-if="showLabels"
        class="block text-sm font-medium text-surface-700"
      >
        Value Source
        <span class="text-red-500">*</span>
      </label>

      <!-- Column Drop Zone -->
      <div
        v-if="isColumnType"
        :class="dropZoneClasses"
        class="border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200 ease-in-out"
        @dragover="disabled ? undefined : handleDragOver"
        @dragenter="disabled ? undefined : handleDragEnter"
        @dragleave="disabled ? undefined : handleDragLeave"
        @drop="disabled ? undefined : handleDrop"
      >
        <!-- Show dropped column info if column is selected -->
        <div
          v-if="valueMapping && valueMapping.type === 'column' && valueMapping.source.columnName"
          class="flex items-center justify-center gap-3"
        >
          <div class="flex items-center gap-2 bg-white border border-surface-200 rounded px-3 py-2">
            <i class="pi pi-database text-primary-600" />
            <span class="font-medium text-surface-900">
              {{ valueMapping?.source.columnName }}
            </span>
            <Tag
              :value="valueMapping?.source.dataType"
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
            :disabled="disabled"
            @click="clearColumnSelection"
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
        v-else-if="isConstantType || isExpressionType"
        :model-value="valueMapping?.source as string"
        :placeholder="isConstantType ? 'Enter constant value...' : 'Enter expression...'"
        :disabled="disabled"
        class="w-full"
        @update:model-value="handleConstantOrExpressionChange"
      />
    </div>
  </div>
</template>
