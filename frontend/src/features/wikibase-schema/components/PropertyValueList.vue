<script setup lang="ts" generic="T">
// Props
interface Props<T> {
  items: T[]
  title: string
  singularLabel: string
  pluralLabel: string
  addButtonLabel: string
  addButtonTestId?: string
  headerIcon?: string
  emptyIcon?: string
  getItemKey?: (item: T, index: number) => string
}

withDefaults(defineProps<Props<T>>(), {
  addButtonTestId: 'add-item-button',
  headerIcon: 'pi pi-list',
  emptyIcon: 'pi pi-inbox',
  getItemKey: (_, index) => `item-${index}`,
})

// Emits
interface Emits {
  add: []
  edit: [index: number]
  remove: [index: number]
}

defineEmits<Emits>()
</script>

<template>
  <div class="space-y-2">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <i
          :class="headerIcon"
          class="text-surface-600"
        />
        <h3 class="text-sm font-medium text-surface-900">{{ title }}</h3>
        <span class="text-xs text-surface-500">
          ({{ items.length }} {{ items.length === 1 ? singularLabel : pluralLabel }})
        </span>
      </div>
      <Button
        :label="addButtonLabel"
        icon="pi pi-plus"
        size="small"
        severity="secondary"
        outlined
        :data-testid="addButtonTestId"
        @click="$emit('add')"
      />
    </div>

    <!-- Items List -->
    <div class="space-y-1">
      <slot
        v-for="(item, index) in items"
        :key="getItemKey(item, index)"
        name="item"
        :item="item"
        :index="index"
        :on-edit="() => $emit('edit', index)"
        :on-remove="() => $emit('remove', index)"
      />
    </div>
  </div>
</template>
