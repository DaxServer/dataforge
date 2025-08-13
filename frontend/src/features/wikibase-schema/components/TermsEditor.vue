<script setup lang="ts">
const schemaStore = useSchemaStore()
</script>

<template>
  <div class="terms-editor space-y-4">
    <!-- Labels Section -->
    <TermSection
      title="Labels"
      term-type="label"
      icon="pi pi-tag"
      placeholder="Drop column for labels"
      test-id="label-drop-zone"
      validation-path="item.terms.labels"
      :values="schemaStore.labels"
      :section-index="0"
    />

    <!-- Descriptions Section -->
    <TermSection
      title="Descriptions"
      term-type="description"
      icon="pi pi-file-o"
      placeholder="Drop column for descriptions"
      test-id="description-drop-zone"
      validation-path="item.terms.descriptions"
      :values="schemaStore.descriptions"
      :section-index="1"
    />

    <!-- Aliases Section -->
    <TermSection
      title="Aliases"
      term-type="alias"
      icon="pi pi-tags"
      placeholder="Drop column for aliases"
      test-id="alias-drop-zone"
      validation-path="item.terms.aliases"
      :values="schemaStore.aliases"
      :section-index="2"
    />
  </div>
</template>
