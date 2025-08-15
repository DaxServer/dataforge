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
  disabled: false,
  showLabels: true,
})

// Emits
const emit = defineEmits<{
  'value-changed': [value: ValueMapping]
}>()

// Composables
const { valueTypes, getCompatibleWikibaseTypes } = useValueMapping()

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

// Handle column drop from DropZone
const handleColumnDrop = (columnInfo: ColumnInfo) => {
  if (props.disabled || props.valueMapping?.type !== 'column') return
  handleColumnSelection(columnInfo)
}

// Get accepted types for the drop zone based on property data type
const acceptedTypes = computed((): WikibaseDataType[] => {
  // For specific property data types, we can be more restrictive
  // but for now, accept all types and let the validation handle compatibility
  return props.propertyDataType
    ? [props.propertyDataType]
    : [
        'string',
        'url',
        'external-id',
        'wikibase-item',
        'wikibase-property',
        'commonsMedia',
        'globe-coordinate',
        'quantity',
        'time',
        'monolingualtext',
      ]
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
      <div v-if="isColumnType">
        <DropZone
          icon="pi pi-upload"
          :placeholder="
            valueMapping && valueMapping.type === 'column' && valueMapping.source.columnName
              ? 'Drop column to replace'
              : 'Drop column here'
          "
          test-id="value-mapping-drop-zone"
          :accepted-types="acceptedTypes"
          :disabled="disabled"
          :selected-column="
            valueMapping && valueMapping.type === 'column' && valueMapping.source.columnName
              ? {
                  name: valueMapping.source.columnName,
                  dataType: valueMapping.source.dataType,
                }
              : undefined
          "
          @column-dropped="handleColumnDrop"
          @clear-selection="clearColumnSelection"
        />
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
