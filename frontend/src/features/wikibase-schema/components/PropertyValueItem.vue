<script setup lang="ts">
// Props
interface Props {
  item: PropertyValueMap
  testId?: string
  editTooltip?: string
  removeTooltip?: string
}

withDefaults(defineProps<Props>(), {
  testId: 'property-value-item',
  editTooltip: 'Edit this property',
  removeTooltip: 'Remove this property',
})

// Emits
interface Emits {
  edit: []
  remove: []
}

defineEmits<Emits>()

// Composables
const { getPropertyDisplayText, getValueDisplayText } = usePropertyValueDisplay()
</script>

<template>
  <div
    class="flex items-center justify-between p-2 bg-white border border-surface-200 rounded text-sm hover:bg-surface-50 transition-colors"
    :data-testid="testId"
  >
    <div class="flex items-center gap-2 flex-1">
      <!-- Property Info -->
      <Tag
        :value="item.property.id"
        size="small"
        severity="info"
      />
      <span class="font-medium text-surface-900">
        {{ getPropertyDisplayText(item.property) }}
      </span>

      <!-- Relationship Arrow -->
      <i class="pi pi-arrow-right text-surface-400 text-xs" />

      <!-- Value Info -->
      <Tag
        :value="getValueDisplayText(item.value)"
        size="small"
        severity="secondary"
      />
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-1">
      <Button
        :v-tooltip="editTooltip"
        icon="pi pi-pencil"
        size="small"
        severity="secondary"
        text
        :data-testid="`edit-${testId}-button`"
        @click="$emit('edit')"
      />
      <Button
        :v-tooltip="removeTooltip"
        icon="pi pi-times"
        size="small"
        severity="danger"
        text
        :data-testid="`remove-${testId}-button`"
        @click="$emit('remove')"
      />
    </div>
  </div>
</template>
