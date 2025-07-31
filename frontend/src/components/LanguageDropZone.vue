<script setup lang="ts">
interface LanguageDropZoneProps {
  termType: 'label' | 'description' | 'alias'
  icon: string
  placeholder: string
  testId: string
}

const props = defineProps<LanguageDropZoneProps>()

const {
  termType,
  selectedLanguage,
  acceptedLanguages,
  hasExistingMappings,
  mappingDisplayData,
  removeMapping,
  setTermType,
} = useLanguageDropZone()

// Set the term type from props
setTermType(props.termType)

// Watch for prop changes
watch(
  () => props.termType,
  (newTermType) => {
    setTermType(newTermType)
  },
)
</script>

<template>
  <div class="language-drop-zone">
    <!-- Existing mappings display -->
    <div
      v-if="hasExistingMappings"
      class="space-y-2 mb-4"
    >
      <div
        v-for="displayItem in mappingDisplayData"
        :key="`${termType}-${displayItem.languageCode}`"
        :data-testid="`${termType}-mapping-${displayItem.languageCode}`"
        class="flex items-center justify-between p-3 bg-surface-50 rounded-lg border"
      >
        <div class="flex items-center space-x-3">
          <Chip
            :label="displayItem.languageCode"
            size="small"
            severity="secondary"
          />
          <div v-if="displayItem.isArray">
            <!-- Handle aliases (array of mappings) -->
            <div
              v-for="(aliasMapping, index) in displayItem.mappings"
              :key="`alias-${displayItem.languageCode}-${index}`"
              class="flex items-center space-x-2"
            >
              <span class="font-medium">{{ aliasMapping.columnName }}</span>
              <span class="text-sm text-surface-600">({{ aliasMapping.dataType }})</span>
              <Button
                :data-testid="`remove-${termType}-mapping-${displayItem.languageCode}-${index}`"
                icon="pi pi-times"
                rounded
                text
                severity="danger"
                size="small"
                @click="removeMapping(displayItem.languageCode, aliasMapping)"
              />
            </div>
          </div>
          <div v-else>
            <!-- Handle labels and descriptions (single mapping) -->
            <template v-if="displayItem.mappings[0]">
              <span class="font-medium">{{ displayItem.mappings[0].columnName }}</span>
              <span class="text-sm text-surface-600 ml-2">
                ({{ displayItem.mappings[0].dataType }})
              </span>
            </template>
          </div>
        </div>
        <Button
          v-if="!displayItem.isArray"
          :data-testid="`remove-${termType}-mapping-${displayItem.languageCode}`"
          icon="pi pi-times"
          size="small"
          severity="danger"
          text
          @click="removeMapping(displayItem.languageCode)"
        />
      </div>
    </div>

    <!-- Language selector and drop zone in horizontal layout -->
    <div class="flex gap-3 items-stretch">
      <!-- Language selector -->
      <div class="flex-shrink-0">
        <label class="block text-sm font-medium text-surface-700 mb-2">Language</label>
        <Select
          v-model="selectedLanguage"
          :data-testid="`${termType}-language-selector`"
          :options="acceptedLanguages"
          placeholder="Select"
          class="w-full"
        />
      </div>

      <!-- Drop zone using reusable SchemaDropZone component -->
      <div class="flex-1 flex flex-col">
        <label class="block text-sm font-medium text-surface-700 mb-2">&nbsp;</label>
        <SchemaDropZone
          :term-type="termType"
          :icon="icon"
          :placeholder="placeholder"
          :test-id="testId"
          :language-code="selectedLanguage"
        />
      </div>
    </div>
  </div>
</template>
