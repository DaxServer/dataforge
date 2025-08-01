<script setup lang="ts">
// Props
interface StatementEditorProps {
  modelValue?: {
    property: PropertyReference | null
    value: ValueMapping
    rank: StatementRank
    qualifiers?: PropertyValueMap[]
    references?: ReferenceSchemaMapping[]
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
    references: [],
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
      qualifiers?: PropertyValueMap[]
      references?: ReferenceSchemaMapping[]
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

// Drag drop context for drag feedback
const { dropFeedback } = useDragDropContext()

// Set up the column drop callback
setOnColumnDrop((_column) => {
  handleColumnDrop(_column)
  emitUpdate()
})

// Generate a temporary statement ID for qualifier management
const tempStatementId = ref(crypto.randomUUID())

// Local qualifiers state
const localQualifiers = ref<PropertyValueMap[]>(props.modelValue?.qualifiers || [])

// Local references state
const localReferences = ref<ReferenceSchemaMapping[]>(props.modelValue?.references || [])

// Methods
const emitUpdate = () => {
  emit('update:modelValue', {
    ...localStatement.value,
    qualifiers: localQualifiers.value,
    references: localReferences.value,
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
const handleAddQualifier = (statementId: UUID, qualifier: PropertyValueMap) => {
  localQualifiers.value.push(qualifier)
  emitUpdate()
}

const handleRemoveQualifier = (statementId: UUID, qualifierIndex: number) => {
  if (qualifierIndex >= 0 && qualifierIndex < localQualifiers.value.length) {
    localQualifiers.value.splice(qualifierIndex, 1)
    emitUpdate()
  }
}

const handleUpdateQualifier = (
  statementId: UUID,
  qualifierIndex: number,
  qualifier: PropertyValueMap,
) => {
  if (qualifierIndex >= 0 && qualifierIndex < localQualifiers.value.length) {
    localQualifiers.value[qualifierIndex] = qualifier
    emitUpdate()
  }
}

// Reference handling methods
const handleAddReference = (statementId: UUID, reference: ReferenceSchemaMapping) => {
  localReferences.value.push(reference)
  emitUpdate()
}

const handleRemoveReference = (statementId: UUID, referenceIndex: number) => {
  if (referenceIndex >= 0 && referenceIndex < localReferences.value.length) {
    localReferences.value.splice(referenceIndex, 1)
    emitUpdate()
  }
}

const handleUpdateReference = (
  statementId: UUID,
  referenceIndex: number,
  reference: ReferenceSchemaMapping,
) => {
  if (referenceIndex >= 0 && referenceIndex < localReferences.value.length) {
    localReferences.value[referenceIndex] = reference
    emitUpdate()
  }
}

const handleAddSnakToReference = (
  statementId: UUID,
  referenceIndex: number,
  snak: PropertyValueMap,
) => {
  if (referenceIndex >= 0 && referenceIndex < localReferences.value.length) {
    const reference = localReferences.value[referenceIndex]
    if (reference) {
      reference.snaks.push(snak)
      emitUpdate()
    }
  }
}

const handleRemoveSnakFromReference = (
  statementId: UUID,
  referenceIndex: number,
  snakIndex: number,
) => {
  const reference = localReferences.value[referenceIndex]
  if (
    referenceIndex >= 0 &&
    referenceIndex < localReferences.value.length &&
    reference &&
    snakIndex >= 0 &&
    snakIndex < reference.snaks.length
  ) {
    reference.snaks.splice(snakIndex, 1)
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

// Watch for references changes
watch(
  () => props.modelValue?.references,
  (newReferences) => {
    localReferences.value = newReferences || []
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
              class="flex flex-col items-center justify-center gap-2 text-surface-600"
            >
              <i class="pi pi-upload" />
              <span class="text-sm font-medium">Drop column here</span>

              <!-- Real-time validation feedback -->
              <div
                v-if="dropFeedback"
                class="mt-2 text-xs px-2 py-1 rounded"
                :class="[
                  dropFeedback.type === 'success'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700',
                ]"
              >
                {{ dropFeedback.message }}
              </div>
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

    <!-- References Section -->
    <div class="border-t border-surface-200 pt-6">
      <ReferencesEditor
        :statement-id="tempStatementId"
        :references="localReferences"
        :available-columns="availableColumns"
        :disabled="disabled"
        @add-reference="handleAddReference"
        @remove-reference="handleRemoveReference"
        @update-reference="handleUpdateReference"
        @add-snak-to-reference="handleAddSnakToReference"
        @remove-snak-from-reference="handleRemoveSnakFromReference"
      />
    </div>

    <!-- Preview -->
    <StatementPreview
      v-if="isValidStatement"
      :statement="localStatement"
      :qualifiers="localQualifiers"
      :references="localReferences"
    />
  </div>
</template>
