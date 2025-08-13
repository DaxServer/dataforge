<script setup lang="ts">
// Props
interface Props {
  valueMapping: ValueMapping
  property: PropertyReference
  rank: StatementRank
  statementId?: UUID
  statementIndex?: number
  qualifiers?: PropertyValueMap[]
  references?: ReferenceSchemaMapping[]
  disabled?: boolean
  showValidation?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  statementId: undefined,
  statementIndex: 1,
  qualifiers: () => [],
  references: () => [],
  disabled: false,
  showValidation: true,
})

// Emits
interface Emits {
  'value-changed': [value: ValueMapping]
  'rank-changed': [rank: StatementRank]
  'qualifiers-changed': [qualifiers: PropertyValueMap[]]
  'references-changed': [references: ReferenceSchemaMapping[]]
}

const emit = defineEmits<Emits>()

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

// Qualifiers state
const isAddingQualifier = ref(false)
const editingQualifierIndex = ref<number | null>(null)

// References state
const isAddingReference = ref(false)
const isAddingSnakToReference = ref<number | null>(null)
const editingSnakInfo = ref<{ referenceIndex: number; snakIndex: number } | null>(null)

// Rank options
const rankOptions = [
  { label: 'Preferred', value: 'preferred' as StatementRank, icon: 'pi pi-star-fill' },
  { label: 'Normal', value: 'normal' as StatementRank, icon: 'pi pi-circle' },
  { label: 'Deprecated', value: 'deprecated' as StatementRank, icon: 'pi pi-times-circle' },
]

// Initialize current mapping from props
watch(
  () => props.valueMapping,
  (newMapping) => {
    if (newMapping) {
      currentMapping.value = { ...newMapping }
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
  emit('value-changed', currentMapping.value)
}

const handleColumnSelection = (columnInfo: ColumnInfo) => {
  if (currentMapping.value.type !== 'column') return

  updateColumnSource(columnInfo)
  emit('value-changed', currentMapping.value)
}

const handleConstantOrExpressionChange = (value: string | undefined) => {
  if (!value) return
  if (currentMapping.value.type === 'column') return

  currentMapping.value.source = value
  emit('value-changed', currentMapping.value)
}

const clearColumnSelection = () => {
  if (currentMapping.value.type === 'column') {
    currentMapping.value.source = {
      columnName: '',
      dataType: 'VARCHAR',
    }
    emit('value-changed', currentMapping.value)
  }
}

const handleRankChanged = (newRank: StatementRank) => {
  emit('rank-changed', newRank)
}

// Qualifiers methods
const startAddingQualifier = () => {
  isAddingQualifier.value = true
  editingQualifierIndex.value = null
}

const startEditingQualifier = (index: number) => {
  isAddingQualifier.value = true
  editingQualifierIndex.value = index
}

const cancelAddingQualifier = () => {
  isAddingQualifier.value = false
  editingQualifierIndex.value = null
}

const handleQualifierSave = (qualifier: PropertyValueMap) => {
  const currentQualifiers = [...(props.qualifiers || [])]
  if (editingQualifierIndex.value !== null) {
    currentQualifiers[editingQualifierIndex.value] = qualifier
  } else {
    currentQualifiers.push(qualifier)
  }

  emit('qualifiers-changed', currentQualifiers)
  cancelAddingQualifier()
}

const removeQualifier = (qualifierIndex: number) => {
  const currentQualifiers = (props.qualifiers || []).filter((_, index) => index !== qualifierIndex)
  emit('qualifiers-changed', currentQualifiers)
}

const getValueTypeIcon = (valueType: string): string => {
  const valueTypeOptions = [
    { label: 'Column', value: 'column', icon: 'pi pi-database' },
    { label: 'Constant', value: 'constant', icon: 'pi pi-lock' },
    { label: 'Expression', value: 'expression', icon: 'pi pi-code' },
  ]
  const option = valueTypeOptions.find((opt) => opt.value === valueType)
  return option?.icon || 'pi pi-question'
}

// References methods
const startAddingReference = () => {
  isAddingReference.value = true
  isAddingSnakToReference.value = null
  editingSnakInfo.value = null
}

const startAddingSnakToReference = (referenceIndex: number) => {
  isAddingSnakToReference.value = referenceIndex
  isAddingReference.value = false
  editingSnakInfo.value = null
}

const startEditingSnak = (referenceIndex: number, snakIndex: number) => {
  isAddingReference.value = false
  isAddingSnakToReference.value = null
  editingSnakInfo.value = { referenceIndex, snakIndex }
}

const cancelAddingReference = () => {
  isAddingReference.value = false
  isAddingSnakToReference.value = null
  editingSnakInfo.value = null
}

const handleSnakSave = (snak: PropertyValueMap) => {
  const currentReferences = [...(props.references || [])]

  if (isAddingReference.value) {
    // Create a new reference with the first snak
    const reference: ReferenceSchemaMapping = {
      id: crypto.randomUUID(),
      snaks: [snak],
    }
    currentReferences.push(reference)
  } else if (isAddingSnakToReference.value !== null) {
    // Add snak to existing reference
    const currentReference = currentReferences[isAddingSnakToReference.value]
    if (currentReference) {
      const updatedReference: ReferenceSchemaMapping = {
        id: currentReference.id || crypto.randomUUID(),
        snaks: [...(currentReference.snaks || []), snak],
      }
      currentReferences[isAddingSnakToReference.value] = updatedReference
    }
  } else if (editingSnakInfo.value !== null) {
    // Update existing snak
    const currentReference = currentReferences[editingSnakInfo.value.referenceIndex]
    if (currentReference) {
      const updatedReference: ReferenceSchemaMapping = {
        id: currentReference.id,
        snaks: currentReference.snaks.map((s, i) =>
          i === editingSnakInfo.value!.snakIndex ? snak : s,
        ),
      }
      currentReferences[editingSnakInfo.value.referenceIndex] = updatedReference
    }
  }

  emit('references-changed', currentReferences)
  cancelAddingReference()
}

const removeReference = (referenceIndex: number) => {
  const currentReferences = (props.references || []).filter((_, index) => index !== referenceIndex)
  emit('references-changed', currentReferences)
}

const removeSnakFromReference = (referenceIndex: number, snakIndex: number) => {
  const currentReferences = [...(props.references || [])]
  const currentReference = currentReferences[referenceIndex]
  if (currentReference) {
    const updatedReference: ReferenceSchemaMapping = {
      id: currentReference.id || crypto.randomUUID(),
      snaks: (currentReference.snaks || []).filter((_, index) => index !== snakIndex),
    }
    currentReferences[referenceIndex] = updatedReference
    emit('references-changed', currentReferences)
  }
}

const getPropertyDisplayText = (property: PropertyReference): string => {
  return property.label || property.id
}

const getValueDisplayText = (value: ValueMapping): string => {
  if (value.type === 'column') {
    return typeof value.source === 'string' ? value.source : value.source.columnName
  }
  return typeof value.source === 'string' ? value.source : 'No mapping'
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
              :severity="rank === option.value ? 'primary' : 'secondary'"
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
            v-for="(error, index) in validationErrors"
            :key="index"
            class="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2"
          >
            <i class="pi pi-exclamation-triangle" />
            <span>{{ error }}</span>
          </div>
        </div>

        <!-- Qualifiers Section -->
        <div class="qualifiers-editor mt-4">
          <!-- Header with Add Button -->
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <i class="pi pi-tags text-surface-600 text-sm" />
              <span class="text-sm font-medium text-surface-900">
                Qualifiers
                <span
                  v-if="(qualifiers || []).length > 0"
                  class="text-xs text-surface-500 font-normal ml-1"
                >
                  ({{ (qualifiers || []).length }})
                </span>
              </span>
            </div>

            <Button
              v-if="!isAddingQualifier"
              icon="pi pi-plus"
              size="small"
              severity="secondary"
              text
              @click="startAddingQualifier"
            />
          </div>

          <!-- Existing Qualifiers List -->
          <div
            v-if="(qualifiers || []).length > 0"
            class="space-y-1"
            data-testid="qualifiers-list"
          >
            <div
              v-for="(qualifier, index) in qualifiers"
              :key="`qualifier-${qualifier.property.id}-${index}`"
              class="flex items-center justify-between p-2 bg-surface-50 border border-surface-200 rounded text-sm hover:bg-surface-100 transition-colors"
              data-testid="qualifier-item"
            >
              <div class="flex items-center gap-2 flex-1">
                <!-- Property Info -->
                <Tag
                  :value="qualifier.property.id"
                  size="small"
                  severity="info"
                />
                <span class="font-medium text-surface-900">
                  {{ qualifier.property.label || qualifier.property.id }}
                </span>

                <!-- Relationship Arrow -->
                <i class="pi pi-arrow-right text-surface-400 text-xs" />

                <!-- Value Info -->
                <Tag
                  :value="
                    qualifier.value.type === 'column'
                      ? qualifier.value.source.columnName
                      : qualifier.value.source
                  "
                  size="small"
                  severity="secondary"
                />
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-1">
                <Button
                  v-tooltip="'Edit qualifier'"
                  icon="pi pi-pencil"
                  size="small"
                  severity="secondary"
                  text
                  data-testid="edit-qualifier-button"
                  @click="startEditingQualifier(index)"
                />
                <Button
                  v-tooltip="'Remove qualifier'"
                  icon="pi pi-trash"
                  size="small"
                  severity="danger"
                  text
                  data-testid="remove-qualifier-button"
                  @click="removeQualifier(index)"
                />
              </div>
            </div>
          </div>

          <!-- Add/Edit Qualifier -->
          <SingleQualifierEditor
            v-if="isAddingQualifier"
            :qualifier="
              editingQualifierIndex !== null ? (qualifiers || [])[editingQualifierIndex] : undefined
            "
            :is-editing="editingQualifierIndex !== null"
            @save="handleQualifierSave"
            @cancel="cancelAddingQualifier"
          />
        </div>

        <!-- References Section -->
        <div class="references-editor mt-4">
          <!-- Header with Add Button -->
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <i class="pi pi-bookmark text-surface-600 text-sm" />
              <span class="text-sm font-medium text-surface-900">
                References
                <span
                  v-if="(references || []).length > 0"
                  class="text-xs text-surface-500 font-normal ml-1"
                >
                  ({{ (references || []).length }})
                </span>
              </span>
            </div>

            <Button
              v-if="!isAddingReference"
              icon="pi pi-plus"
              size="small"
              severity="secondary"
              text
              @click="startAddingReference"
            />
          </div>

          <!-- Existing References List -->
          <div
            v-if="(references || []).length > 0"
            class="space-y-1"
            data-testid="references-list"
          >
            <!-- Individual References -->
            <div
              v-for="(reference, referenceIndex) in references"
              :key="`reference-${reference.id}`"
              class="border border-surface-200 rounded bg-surface-50"
              data-testid="reference-item"
            >
              <!-- Reference Header -->
              <div
                class="flex items-center justify-between p-2 border-b border-surface-200 bg-orange-50"
              >
                <div class="flex items-center gap-2 text-sm font-medium text-orange-700">
                  <i class="pi pi-bookmark text-xs" />
                  <span>Reference {{ referenceIndex + 1 }}</span>
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
                    @click="startAddingSnakToReference(referenceIndex)"
                  />
                  <Button
                    v-tooltip="'Remove entire reference'"
                    icon="pi pi-trash"
                    size="small"
                    severity="danger"
                    text
                    data-testid="remove-reference-button"
                    @click="removeReference(referenceIndex)"
                  />
                </div>
              </div>

              <!-- Reference Snaks (Property-Value Pairs) -->
              <div class="p-2 space-y-1">
                <div
                  v-for="(snak, snakIndex) in reference.snaks"
                  :key="`reference-${reference.id}-snak-${snakIndex}`"
                  class="flex items-center justify-between p-2 bg-white border border-surface-200 rounded text-sm hover:bg-surface-50 transition-colors"
                  data-testid="reference-snak"
                >
                  <div class="flex items-center gap-2 flex-1">
                    <!-- Property Info -->
                    <Tag
                      :value="snak.property.id"
                      size="small"
                      severity="info"
                    />
                    <span class="font-medium text-surface-900">
                      {{ getPropertyDisplayText(snak.property) }}
                    </span>

                    <!-- Relationship Arrow -->
                    <i class="pi pi-arrow-right text-surface-400 text-xs" />

                    <!-- Value Info -->
                    <Tag
                      :value="getValueDisplayText(snak.value)"
                      size="small"
                      severity="secondary"
                    />
                  </div>

                  <!-- Snak Actions -->
                  <div class="flex items-center gap-1">
                    <Button
                      v-tooltip="'Edit this property'"
                      icon="pi pi-pencil"
                      size="small"
                      severity="secondary"
                      text
                      data-testid="edit-snak-button"
                      @click="startEditingSnak(referenceIndex, snakIndex)"
                    />
                    <Button
                      v-tooltip="'Remove this property from reference'"
                      icon="pi pi-times"
                      size="small"
                      severity="danger"
                      text
                      data-testid="remove-snak-button"
                      @click="removeSnakFromReference(referenceIndex, snakIndex)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Add/Edit Reference -->
          <SingleReferenceEditor
            v-if="isAddingReference || isAddingSnakToReference !== null || editingSnakInfo !== null"
            :snak="
              editingSnakInfo
                ? (references || [])[editingSnakInfo.referenceIndex]?.snaks[
                    editingSnakInfo.snakIndex
                  ]
                : undefined
            "
            :is-editing="editingSnakInfo !== null"
            :is-adding-to-reference="isAddingSnakToReference !== null"
            @save="handleSnakSave"
            @cancel="cancelAddingReference"
          />
        </div>
      </div>
    </template>
  </Card>
</template>
