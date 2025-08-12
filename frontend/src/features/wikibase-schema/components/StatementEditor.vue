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
  rankOptions,
  isValidStatement,
  handleRankChange,
  handleColumnDrop,
  initializeStatement,
  setAvailableColumns,
} = useStatementEditor()

const { setOnColumnDrop } = useStatementDropZone()

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

// Local state for PropertyValueMappingEditor
const localPropertyId = ref(props.modelValue?.property?.id || '')
const localValueMapping = ref<ValueMapping>(
  props.modelValue?.value || {
    type: 'column',
    source: {
      columnName: '',
      dataType: 'VARCHAR',
    },
    dataType: 'string',
  },
)
const localProperty = computed(() => localStatement.value.property)

// Validation state
const validationErrors = ref<string[]>([])

// Methods
const emitUpdate = () => {
  emit('update:modelValue', {
    ...localStatement.value,
    qualifiers: localQualifiers.value,
    references: localReferences.value,
  })
}

const handleSave = () => {
  if (isValidStatement.value && validationErrors.value.length === 0) {
    emit('save')
  }
}

const handleCancel = () => {
  emit('cancel')
}

const handlePropertyChanged = (property: PropertyReference | null) => {
  if (property) {
    localStatement.value.property = property
    localPropertyId.value = property.id
  } else {
    localStatement.value.property = null
    localPropertyId.value = ''
  }
  emitUpdate()
}

const handleValueChanged = (valueMapping: ValueMapping) => {
  localStatement.value.value = { ...valueMapping }
  localValueMapping.value = { ...valueMapping }
  emitUpdate()
}

const handleRankChangeWithEmit = (newRank: StatementRank) => {
  handleRankChange(newRank)
  emitUpdate()
}

// Qualifier handling methods
// @ts-expect-error ToDo Fix
const handleAddQualifier = (statementId: UUID, qualifier: PropertyValueMap) => {
  localQualifiers.value.push(qualifier)
  emitUpdate()
}

// @ts-expect-error ToDo Fix
const handleRemoveQualifier = (statementId: UUID, qualifierIndex: number) => {
  if (qualifierIndex >= 0 && qualifierIndex < localQualifiers.value.length) {
    localQualifiers.value.splice(qualifierIndex, 1)
    emitUpdate()
  }
}

const handleUpdateQualifier = (
  // @ts-expect-error ToDo Fix
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
// @ts-expect-error ToDo Fix
const handleAddReference = (statementId: UUID, reference: ReferenceSchemaMapping) => {
  localReferences.value.push(reference)
  emitUpdate()
}

// @ts-expect-error ToDo Fix
const handleRemoveReference = (statementId: UUID, referenceIndex: number) => {
  if (referenceIndex >= 0 && referenceIndex < localReferences.value.length) {
    localReferences.value.splice(referenceIndex, 1)
    emitUpdate()
  }
}

const handleUpdateReference = (
  // @ts-expect-error ToDo Fix
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
  // @ts-expect-error ToDo Fix
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
  // @ts-expect-error ToDo Fix
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
    if (newValue) {
      initializeStatement(newValue)
      // Update local state for PropertyValueMappingEditor
      localPropertyId.value = newValue.property?.id || ''
      localValueMapping.value = { ...newValue.value }
    }
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
          :disabled="!isValidStatement || validationErrors.length > 0"
          size="small"
          @click="handleSave"
        />
      </div>
    </div>

    <!-- Property-Value Mapping -->
    <PropertyValueMappingEditor
      v-model:property-id="localPropertyId"
      v-model:value-mapping="localValueMapping"
      validation-path="statement"
      @property-changed="handlePropertyChanged"
      @value-changed="handleValueChanged"
      @validation-changed="
        (isValid, errors) => {
          validationErrors = errors
        }
      "
    />

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
