<script setup lang="ts">
// Props
interface Props {
  reference: ReferenceSchemaMapping
  index: number
}

defineProps<Props>()

// Emits
interface Emits {
  addSnak: []
  remove: []
  editSnak: [snakIndex: number]
  removeSnak: [snakIndex: number]
}

defineEmits<Emits>()
</script>

<template>
  <div
    class="border border-surface-200 rounded bg-surface-50"
    data-testid="reference-item"
  >
    <!-- Reference Header -->
    <div class="flex items-center justify-between p-2 border-b border-surface-200 bg-orange-50">
      <div class="flex items-center gap-2 text-sm font-medium text-orange-700">
        <i class="pi pi-bookmark text-xs" />
        <span>Reference {{ index + 1 }}</span>
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
          @click="$emit('addSnak')"
        />
        <Button
          v-tooltip="'Remove entire reference'"
          icon="pi pi-trash"
          size="small"
          severity="danger"
          text
          data-testid="remove-reference-button"
          @click="$emit('remove')"
        />
      </div>
    </div>

    <!-- Reference Snaks (Property-Value Pairs) -->
    <div class="p-2 space-y-1">
      <PropertyValueItem
        v-for="(snak, snakIndex) in reference.snaks"
        :key="`reference-${reference.id}-snak-${snakIndex}`"
        :item="snak"
        test-id="reference-snak"
        edit-tooltip="Edit this property"
        remove-tooltip="Remove this property from reference"
        @edit="$emit('editSnak', snakIndex)"
        @remove="$emit('removeSnak', snakIndex)"
      />
    </div>
  </div>
</template>
