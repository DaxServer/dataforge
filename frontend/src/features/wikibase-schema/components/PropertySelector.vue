<script setup lang="ts">
// Props
interface PropertySelectorProps {
  modelValue?: PropertyReference | null
  placeholder?: string
  disabled?: boolean
}

withDefaults(defineProps<PropertySelectorProps>(), {
  modelValue: null,
  placeholder: 'Search for a property...',
  disabled: false,
})

// Emits
interface PropertySelectorEmits {
  update: [value: PropertyReference | null]
}

const emit = defineEmits<PropertySelectorEmits>()

// Use property selection composable
const { filterProperties } = usePropertySelection()

// Local state
const suggestions = ref<PropertyReference[]>([])

// Format property for display
const formatProperty = (property: PropertyReference): string => {
  return property.label ? `${property.id} - ${property.label}` : property.id
}

// Search handler for AutoComplete
const handleSearch = (event: { query: string }) => {
  suggestions.value = filterProperties(event.query)
}

// Selection handler
const handleSelect = (event: { value: PropertyReference }) => {
  emit('update', event.value)
}

// Clear handler
const handleClear = () => {
  emit('update', null)
}
</script>

<template>
  <AutoComplete
    :model-value="modelValue"
    :suggestions="suggestions"
    :placeholder="placeholder"
    :disabled="disabled"
    :option-label="formatProperty"
    class="w-full"
    @complete="handleSearch"
    @item-select="handleSelect"
    @clear="handleClear"
  >
    <template #option="{ option }">
      <div class="flex items-center gap-2">
        <Tag
          :value="option.id"
          size="small"
          severity="info"
        />
        <span
          v-if="option.label"
          class="font-medium"
        >
          {{ option.label }}
        </span>
        <span
          v-else
          class="text-surface-500 italic"
        >
          No label
        </span>
      </div>
    </template>
  </AutoComplete>
</template>
