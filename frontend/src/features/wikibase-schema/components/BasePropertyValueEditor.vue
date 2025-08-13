<script setup lang="ts" generic="T">
// Props
interface Props<T> {
  items: T[]
  title: string
  singularLabel: string
  pluralLabel: string
  addButtonLabel: string
  addButtonTestId?: string
  emptyMessage: string
  headerIcon?: string
  emptyIcon?: string
  getItemKey?: (item: T, index: number) => string
  showEditor?: boolean
  currentItem?: T
  isEditing?: boolean
}

withDefaults(defineProps<Props<T>>(), {
  addButtonTestId: 'add-item-button',
  headerIcon: 'pi pi-list',
  emptyIcon: 'pi pi-inbox',
  getItemKey: (_, index) => `item-${index}`,
  showEditor: false,
  currentItem: undefined,
  isEditing: false,
})

// Emits
interface Emits<T> {
  add: []
  edit: [index: number]
  remove: [index: number]
  save: [item: T]
  cancel: []
}

const emit = defineEmits<Emits<T>>()

// Event handlers
const handleAdd = () => {
  emit('add')
}

const handleEdit = (index: number) => {
  emit('edit', index)
}

const handleRemove = (index: number) => {
  emit('remove', index)
}

const handleSave = (item: T) => {
  emit('save', item)
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header with Add Button -->
    <PropertyValueList
      :items="items"
      :title="title"
      :singular-label="singularLabel"
      :plural-label="pluralLabel"
      :add-button-label="addButtonLabel"
      :add-button-test-id="addButtonTestId"
      :empty-message="emptyMessage"
      :header-icon="headerIcon"
      :empty-icon="emptyIcon"
      :get-item-key="getItemKey"
      @add="handleAdd"
      @edit="handleEdit"
      @remove="handleRemove"
    >
      <template #item="{ item, index, onEdit, onRemove }">
        <slot
          name="item"
          :item="item"
          :index="index"
          :on-edit="onEdit"
          :on-remove="onRemove"
        />
      </template>
    </PropertyValueList>

    <!-- Single Item Editor -->
    <slot
      v-if="showEditor"
      name="editor"
      :current-item="currentItem"
      :is-editing="isEditing"
      :on-save="handleSave"
      :on-cancel="handleCancel"
    />
  </div>
</template>
