<script setup lang="ts">
// Props
interface StatementEditorProps {
  modelValue?: {
    property: PropertyReference | null
    value: ValueMapping
    rank: StatementRank
    qualifiers?: QualifierSchemaMapping[]
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
    qualifiers: [],
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
      qualifiers?: QualifierSchemaMapping[]
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

const {
  getValidationMessage,
  getValidationClasses,
  getValidationIcon,
  isValidationValid,
  getValidationSeverity,
} = useStatementValidationDisplay()

// Set up the column drop callback
setOnColumnDrop((_column) => {
  handleColumnDrop(_column)
  emitUpdate()
})

// Generate a temporary statement ID for qualifier management
const tempStatementId = ref(crypto.randomUUID())

// Local qualifiers state
const localQualifiers = ref<QualifierSchemaMapping[]>(props.modelValue?.qualifiers || [])

// Methods
const emitUpdate = () => {
  emit('update:modelValue', {
    ...localStatement.value,
    qualifiers: localQualifiers.value,
  })
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
    localStatement.value.value = {
      type: 'column',
      source: {
        columnName: '',
        dataType: 'VARCHAR',
      },
      dataType: localStatement.value.value.dataType,
    }
    emitUpdate()
  }
}

// Qualifier handling methods
const handleAddQualifier = (statementId: string, qualifier: QualifierSchemaMapping) => {
  localQualifiers.value.push(qualifier)
  emitUpdate()
}

const handleRemoveQualifier = (statementId: string, qualifierIndex: number) => {
  if (qualifierIndex >= 0 && qualifierIndex < localQualifiers.value.length) {
    localQualifiers.value.splice(qualifierIndex, 1)
    emitUpdate()
  }
}

const handleUpdateQualifier = (
  statementId: string,
  qualifierIndex: number,
  qualifier: QualifierSchemaMapping,
) => {
  if (qualifierIndex >= 0 && qualifierIndex < localQualifiers.value.length) {
    localQualifiers.value[qualifierIndex] = qualifier
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

// Watch for qualifiers changes
watch(
  () => props.modelValue?.qualifiers,
  (newQualifiers) => {
    localQualifiers.value = newQualifiers || []
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
          :disabled="
            !isValidStatement || !isValidationValid(localStatement.value, localStatement.property)
          "
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
                localStatement.value.type === 'column' && localStatement.value.source.columnName
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
          :class="[
            'w-full',
            !isValidationValid(localStatement.value, localStatement.property) ? 'p-invalid' : '',
          ]"
          :severity="getValidationSeverity(localStatement.value, localStatement.property)"
          @update:model-value="handleDataTypeChangeWithEmit"
        />

        <!-- Enhanced Data Type Validation Message -->
        <div
          v-if="getValidationMessage(localStatement.value, localStatement.property)"
          class="validation-message"
        >
          <div
            :class="[
              'flex items-start gap-2 text-sm p-3 rounded-lg border',
              getValidationClasses(localStatement.value, localStatement.property),
            ]"
          >
            <i
              v-if="getValidationIcon(localStatement.value, localStatement.property)"
              :class="[
                getValidationIcon(localStatement.value, localStatement.property)?.icon,
                getValidationIcon(localStatement.value, localStatement.property)?.class,
                'mt-0.5 flex-shrink-0',
              ]"
            />
            <div class="flex-1">
              <div class="font-medium">
                {{ getValidationMessage(localStatement.value, localStatement.property)?.message }}
              </div>
              <div
                v-if="
                  getValidationMessage(localStatement.value, localStatement.property)?.suggestions
                "
                class="mt-1 text-xs opacity-75"
              >
                <div
                  v-for="suggestion in getValidationMessage(
                    localStatement.value,
                    localStatement.property,
                  )?.suggestions"
                  :key="suggestion"
                  class="flex items-center gap-1"
                >
                  <i class="pi pi-lightbulb" />
                  <span>{{ suggestion }}</span>
                </div>
              </div>
            </div>
          </div>
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

    <!-- Qualifiers Section -->
    <div class="border-t border-surface-200 pt-6">
      <QualifiersEditor
        :statement-id="tempStatementId"
        :qualifiers="localQualifiers"
        :available-columns="availableColumns"
        :disabled="disabled"
        @add-qualifier="handleAddQualifier"
        @remove-qualifier="handleRemoveQualifier"
        @update-qualifier="handleUpdateQualifier"
      />
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
              localStatement.value.type === 'column'
                ? localStatement.value.source.columnName
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

        <!-- Qualifiers Preview -->
        <div
          v-if="localQualifiers.length > 0"
          class="ml-8 mt-3 border-l-2 border-primary-200 pl-3 bg-gradient-to-r from-primary-25 to-transparent rounded-r"
          data-testid="qualifiers-preview"
        >
          <div class="text-xs text-primary-700 font-medium mb-2 flex items-center gap-1">
            <i class="pi pi-tags text-xs" />
            <span>Qualifiers ({{ localQualifiers.length }}):</span>
          </div>
          <div class="space-y-2">
            <div
              v-for="(qualifier, index) in localQualifiers"
              :key="`preview-qualifier-${index}`"
              class="flex items-center gap-2 text-xs text-surface-600 p-2 bg-white/50 rounded border border-primary-100"
              data-testid="qualifier-preview-item"
            >
              <div class="flex items-center gap-1 text-primary-600">
                <i class="pi pi-angle-right text-xs" />
                <span class="font-medium">Q{{ index + 1 }}</span>
              </div>
              <span class="font-medium">
                {{ qualifier.property.label || qualifier.property.id }}:
              </span>
              <Tag
                :value="
                  qualifier.value.type === 'column'
                    ? qualifier.value.source.columnName
                    : qualifier.value.source
                "
                size="small"
                severity="secondary"
              />
              <span class="text-surface-400">{{ qualifier.value.dataType }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
