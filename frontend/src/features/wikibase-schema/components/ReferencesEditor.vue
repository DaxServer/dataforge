<script setup lang="ts">
interface ReferencesEditorProps {
  statementId: UUID
  references?: ReferenceSchemaMapping[]
}

const props = withDefaults(defineProps<ReferencesEditorProps>(), {
  references: () => [],
})

const schemaStore = useSchemaStore()

// Use the composable for state management
const { isAdding, startAdding, startEditing, cancelEditing } = usePropertyValueEditor()

// Additional state for reference-specific functionality
const isAddingSnakToReference = ref<number | null>(null)
const editingSnakInfo = ref<{ referenceIndex: number; snakIndex: number } | null>(null)

// Handle remove with store update
const handleRemove = (index: number) => {
  const updatedReferences = props.references.filter((_, i) => i !== index)
  schemaStore.updateStatementById(props.statementId, 'references', updatedReferences)
}

// Reference-specific state reset helper
const resetReferenceState = () => {
  isAddingSnakToReference.value = null
  editingSnakInfo.value = null
}

const startAddingSnakToReference = (referenceIndex: number) => {
  isAddingSnakToReference.value = referenceIndex
  cancelEditing()
  editingSnakInfo.value = null
}

const startEditingSnak = (referenceIndex: number, snakIndex: number) => {
  cancelEditing()
  isAddingSnakToReference.value = null
  editingSnakInfo.value = { referenceIndex, snakIndex }
}

const cancelAddingReference = () => {
  cancelEditing()
  resetReferenceState()
}

const handleSnakSave = (snak: PropertyValueMap) => {
  const statement = schemaStore.statements.find((s: any) => s.id === props.statementId)
  if (!statement) return

  if (isAdding.value) {
    // Create a new reference with the first snak
    const reference: ReferenceSchemaMapping = {
      id: crypto.randomUUID(),
      snaks: [snak],
    }
    const updatedReferences = [...statement.references, reference]
    schemaStore.updateStatementById(props.statementId, 'references', updatedReferences)
  } else if (isAddingSnakToReference.value !== null) {
    // Add snak to existing reference
    const updatedReferences = [...statement.references]
    const currentReference = updatedReferences[isAddingSnakToReference.value]
    if (currentReference) {
      const updatedReference: ReferenceSchemaMapping = {
        id: currentReference.id || crypto.randomUUID(),
        snaks: [...(currentReference.snaks || []), snak],
      }
      updatedReferences[isAddingSnakToReference.value] = updatedReference
      schemaStore.updateStatementById(props.statementId, 'references', updatedReferences)
    }
  } else if (editingSnakInfo.value !== null) {
    // Update existing snak
    const updatedReferences = [...statement.references]
    const currentReference = updatedReferences[editingSnakInfo.value.referenceIndex]
    if (currentReference) {
      const updatedReference: ReferenceSchemaMapping = {
        id: currentReference.id,
        snaks: currentReference.snaks.map((s, i) =>
          i === editingSnakInfo.value!.snakIndex ? snak : s,
        ),
      }
      updatedReferences[editingSnakInfo.value.referenceIndex] = updatedReference
      schemaStore.updateStatementById(props.statementId, 'references', updatedReferences)
    }
  }

  cancelEditing()
  resetReferenceState()
}

const removeSnakFromReference = (referenceIndex: number, snakIndex: number) => {
  const statement = schemaStore.statements.find((s: any) => s.id === props.statementId)
  if (statement && statement.references && statement.references[referenceIndex]) {
    const updatedReferences = [...statement.references]
    const currentReference = updatedReferences[referenceIndex]
    if (currentReference) {
      const updatedReference: ReferenceSchemaMapping = {
        id: currentReference.id || crypto.randomUUID(),
        snaks: (currentReference.snaks || []).filter(
          (_: any, index: number) => index !== snakIndex,
        ),
      }
      updatedReferences[referenceIndex] = updatedReference
      schemaStore.updateStatementById(props.statementId, 'references', updatedReferences)
    }
  }
}
</script>

<template>
  <BasePropertyValueEditor
    :items="references"
    title="References"
    singular-label="reference"
    plural-label="references"
    add-button-label="Add Reference"
    add-button-test-id="add-reference-button"
    empty-message="No references added yet. Click 'Add Reference' to get started."
    :show-editor="isAdding || isAddingSnakToReference !== null || editingSnakInfo !== null"
    @add="startAdding"
    @edit="startEditing"
    @remove="handleRemove"
  >
    <template #item="{ item, index, onRemove }">
      <ReferenceContainer
        :reference="item"
        :index="index"
        @add-snak="startAddingSnakToReference(index)"
        @edit-snak="(snakIndex) => startEditingSnak(index, snakIndex)"
        @remove-snak="(snakIndex) => removeSnakFromReference(index, snakIndex)"
        @remove="onRemove"
      />
    </template>

    <template #editor>
      <SingleReferenceEditor
        v-if="isAdding || isAddingSnakToReference !== null || editingSnakInfo !== null"
        :statement-id="statementId"
        :snak="
          editingSnakInfo
            ? references[editingSnakInfo.referenceIndex]?.snaks[editingSnakInfo.snakIndex]
            : undefined
        "
        :is-editing="editingSnakInfo !== null"
        :is-adding-to-reference="isAddingSnakToReference !== null"
        @save="handleSnakSave"
        @cancel="cancelAddingReference"
      />
    </template>
  </BasePropertyValueEditor>
</template>
