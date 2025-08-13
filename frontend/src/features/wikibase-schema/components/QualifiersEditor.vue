<script setup lang="ts">
// Props
interface Props {
  statementId: UUID
  qualifiers: PropertyValueMap[]
}

const props = defineProps<Props>()
const schemaStore = useSchemaStore()

const isAddingQualifier = ref(false)
const editingQualifierIndex = ref<number | null>(null)

// Computed properties
const qualifiers = computed(() => props.qualifiers || [])

// Methods
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
  if (editingQualifierIndex.value !== null) {
    const statement = schemaStore.statements.find((s: any) => s.id === props.statementId)
    if (statement) {
      const updatedQualifiers = [...(statement.qualifiers || [])]
      updatedQualifiers[editingQualifierIndex.value] = qualifier
      schemaStore.updateStatement(
        props.statementId,
        statement.property,
        statement.value,
        statement.rank,
        updatedQualifiers,
        statement.references,
      )
    }
  } else {
    const statement = schemaStore.statements.find((s: any) => s.id === props.statementId)
    if (statement) {
      const updatedQualifiers = [...(statement.qualifiers || []), qualifier]
      schemaStore.updateStatement(
        props.statementId,
        statement.property,
        statement.value,
        statement.rank,
        updatedQualifiers,
        statement.references,
      )
    }
  }
  cancelAddingQualifier()
}

const removeQualifier = (qualifierIndex: number) => {
  const statement = schemaStore.statements.find((s: any) => s.id === props.statementId)
  if (statement) {
    const updatedQualifiers = (statement.qualifiers || []).filter(
      (_: any, index: number) => index !== qualifierIndex,
    )
    schemaStore.updateStatement(
      props.statementId,
      statement.property,
      statement.value,
      statement.rank,
      updatedQualifiers,
      statement.references,
    )
  }
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
</script>

<template>
  <div class="qualifiers-editor">
    <!-- Header with Add Button -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <i class="pi pi-tags text-surface-600 text-sm" />
        <span class="text-sm font-medium text-surface-900">
          Qualifiers
          <span
            v-if="qualifiers.length > 0"
            class="text-xs text-surface-500 font-normal ml-1"
          >
            ({{ qualifiers.length }})
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
      v-if="qualifiers.length > 0"
      class="space-y-2"
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
      :qualifier="editingQualifierIndex !== null ? qualifiers[editingQualifierIndex] : undefined"
      :is-editing="editingQualifierIndex !== null"
      @save="handleQualifierSave"
      @cancel="cancelAddingQualifier"
    />
  </div>
</template>
