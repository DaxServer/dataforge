<script setup lang="ts">
interface QualifiersEditorProps {
  statementId: UUID
  qualifiers?: PropertyValueMap[]
}

const props = withDefaults(defineProps<QualifiersEditorProps>(), {
  qualifiers: () => [],
})

const schemaStore = useSchemaStore()

// Use the composable for state management
const {
  isAdding,
  editingIndex,
  startAdding,
  startEditing,
  cancelEditing,
  handleSave: composableHandleSave,
  handleRemove: composableHandleRemove,
} = usePropertyValueEditor()

// Computed for current item being edited
const currentItem = computed(() => {
  return editingIndex.value !== null ? props.qualifiers[editingIndex.value] : undefined
})

// Handle save with store update
const handleSave = (qualifier: PropertyValueMap) => {
  const updatedQualifiers = composableHandleSave(qualifier, props.qualifiers)
  schemaStore.updateStatementById(props.statementId, 'qualifiers', updatedQualifiers)
}

// Handle remove with store update
const handleRemove = (index: number) => {
  const updatedQualifiers = composableHandleRemove(index, props.qualifiers)
  schemaStore.updateStatementById(props.statementId, 'qualifiers', updatedQualifiers)
}
</script>

<template>
  <BasePropertyValueEditor
    :items="qualifiers"
    title="Qualifiers"
    singular-label="qualifier"
    plural-label="qualifiers"
    add-button-label="Add Qualifier"
    add-button-test-id="add-qualifier-button"
    empty-message="No qualifiers added yet. Click 'Add Qualifier' to get started."
    header-icon="pi pi-tags"
    empty-icon="pi pi-tags"
    :show-editor="isAdding"
    :current-item="currentItem"
    :is-editing="editingIndex !== null"
    @add="startAdding"
    @edit="startEditing"
    @remove="handleRemove"
    @save="handleSave"
    @cancel="cancelEditing"
  >
    <template #item="{ item, onEdit, onRemove }">
      <PropertyValueItem
        :item="item"
        test-id="qualifier-item"
        edit-tooltip="Edit qualifier"
        remove-tooltip="Remove qualifier"
        @edit="onEdit"
        @remove="onRemove"
      />
    </template>

    <template #editor="{ currentItem, isEditing, onSave, onCancel }">
      <SingleQualifierEditor
        :statement-id="statementId"
        :qualifier="currentItem"
        :is-editing="isEditing"
        @save="onSave"
        @cancel="onCancel"
      />
    </template>
  </BasePropertyValueEditor>
</template>
