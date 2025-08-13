<script setup lang="ts">
// Props
interface Props {
  statement: StatementSchema
  statementIndex?: number
  disabled?: boolean
  showValidation?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  statementIndex: 1,
  disabled: false,
  showValidation: true,
})

// Store
const schemaStore = useSchemaStore()

// Composables
const {
  currentMapping,
  valueTypes,
  isColumnType,
  isConstantType,
  isExpressionType,
  sourceValue,
  updateValueType,
  updateColumnSource,
  validateMapping,
} = useValueMapping()

const {
  dropZoneClasses,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  handleDrop,
  setOnColumnDrop,
} = useStatementDropZone()

// Local state
const validationErrors = ref<string[]>([])

// Rank options
const rankOptions = [
  { label: 'Preferred', value: 'preferred' as StatementRank, icon: 'pi pi-star-fill' },
  { label: 'Normal', value: 'normal' as StatementRank, icon: 'pi pi-circle' },
  { label: 'Deprecated', value: 'deprecated' as StatementRank, icon: 'pi pi-times-circle' },
]

// Watch for statement value changes to sync with currentMapping
watch(
  () => props.statement.value,
  (newValue) => {
    if (newValue) {
      currentMapping.value = { ...newValue }
    }
  },
  { immediate: true, deep: true },
)

// Watch for validation changes
watch(
  () => currentMapping.value,
  () => {
    const validation = validateMapping(currentMapping.value)
    validationErrors.value = validation.errors
  },
  { deep: true, immediate: true },
)

// Methods
const handleValueTypeChange = (newType: 'column' | 'constant' | 'expression') => {
  updateValueType(newType)
  schemaStore.updateStatementById(props.statement.id, 'value', currentMapping.value)
}

const handleColumnSelection = (columnInfo: ColumnInfo) => {
  if (currentMapping.value.type !== 'column') return

  updateColumnSource(columnInfo)
  schemaStore.updateStatementById(props.statement.id, 'value', currentMapping.value)
}

const handleConstantOrExpressionChange = (value: string | undefined) => {
  if (!value) return
  if (currentMapping.value.type === 'column') return

  currentMapping.value.source = value
  schemaStore.updateStatementById(props.statement.id, 'value', currentMapping.value)
}

const clearColumnSelection = () => {
  if (currentMapping.value.type === 'column') {
    currentMapping.value.source = {
      columnName: '',
      dataType: 'VARCHAR',
    }
    schemaStore.updateStatementById(props.statement.id, 'value', currentMapping.value)
  }
}

const handleRankChanged = (newRank: StatementRank) => {
  schemaStore.updateStatementById(props.statement.id, 'rank', newRank)
}

// Set up column drop callback
setOnColumnDrop((columnInfo: ColumnInfo) => {
  if (props.disabled || currentMapping.value.type !== 'column') return
  handleColumnSelection(columnInfo)
})
</script>

<template>
  <Card class="bg-white shadow-md border border-gray-200 rounded-lg overflow-hidden">
    <template #header>
      <div class="flex items-center gap-2 px-4 py-2 border-b bg-gray-50">
        <i class="pi pi-file-edit text-primary" />
        <span class="font-semibold">Statement {{ statementIndex }}</span>
      </div>
    </template>
    <template #content>
      <div class="space-y-3">
        <!-- Statement Rank -->
        <div class="space-y-1">
          <label class="block text-sm font-medium text-surface-700">Rank</label>
          <div class="flex gap-1">
            <Button
              v-for="option in rankOptions"
              :key="option.value"
              :label="option.label"
              :icon="option.icon"
              :severity="statement.rank === option.value ? 'primary' : 'secondary'"
              size="small"
              :disabled="disabled"
              @click="handleRankChanged(option.value)"
            />
          </div>
        </div>

        <!-- Value Type and Source Layout -->
        <div class="flex gap-3">
          <!-- Value Type Selection -->
          <div class="space-y-1">
            <label class="block text-sm font-medium text-surface-700">
              Value Type
              <span class="text-red-500">*</span>
            </label>
            <Select
              :model-value="currentMapping.type"
              :options="valueTypes"
              option-label="label"
              option-value="value"
              placeholder="Select value type"
              :disabled="disabled"
              @update:model-value="handleValueTypeChange"
            >
              <template #option="{ option }">
                <div class="flex items-center gap-2">
                  <i :class="option.icon" />
                  <span>{{ option.label }}</span>
                </div>
              </template>
              <template #value="{ value }">
                <div
                  v-if="value"
                  class="flex items-center gap-2"
                >
                  <i :class="valueTypes.find((t) => t.value === value)?.icon" />
                  <span>{{ valueTypes.find((t) => t.value === value)?.label }}</span>
                </div>
              </template>
            </Select>
          </div>

          <!-- Value Source Configuration -->
          <div class="flex-1 space-y-1">
            <label class="block text-sm font-medium text-surface-700">
              Value Source
              <span class="text-red-500">*</span>
            </label>

            <!-- Column Drop Zone -->
            <div
              v-if="isColumnType"
              :class="dropZoneClasses"
              class="border-2 border-dashed rounded-lg p-3 text-center transition-all duration-200 ease-in-out"
              @dragover="handleDragOver"
              @dragenter="handleDragEnter"
              @dragleave="handleDragLeave"
              @drop="handleDrop"
            >
              <!-- Show dropped column info if column is selected -->
              <div
                v-if="currentMapping.type === 'column' && currentMapping.source.columnName"
                class="flex items-center justify-center gap-3"
              >
                <div
                  class="flex items-center gap-2 bg-white border border-surface-200 rounded px-3 py-2"
                >
                  <i class="pi pi-database text-primary-600" />
                  <span class="font-medium text-surface-900">
                    {{ currentMapping.source.columnName }}
                  </span>
                  <Tag
                    :value="currentMapping.source.dataType"
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
              :model-value="sourceValue"
              :placeholder="isConstantType ? 'Enter constant value...' : 'Enter expression...'"
              :disabled="disabled"
              class="w-full"
              @update:model-value="handleConstantOrExpressionChange"
            />
          </div>
        </div>

        <!-- Validation Errors -->
        <div
          v-if="showValidation && validationErrors.length > 0"
          class="space-y-2"
        >
          <div
            v-for="error in validationErrors"
            :key="error"
            class="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2"
          >
            <i class="pi pi-exclamation-triangle" />
            <span>{{ error }}</span>
          </div>
        </div>

        <!-- Qualifiers Section -->
        <div class="mt-4">
          <QualifiersEditor
            :statement-id="statement.id"
            :qualifiers="statement.qualifiers"
          />
        </div>

        <!-- References Section -->
        <div class="mt-4">
          <ReferencesEditor
            :statement-id="statement.id"
            :references="statement.references"
          />
        </div>
      </div>
    </template>
  </Card>
</template>
