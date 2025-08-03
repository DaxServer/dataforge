<script setup lang="ts"></script>

<template>
  <div class="terms-editor space-y-6">
    <!-- Labels Section -->
    <TermSection
      title="Labels"
      term-type="label"
      icon="pi pi-tag"
      placeholder="Drop column for labels"
      test-id="label-drop-zone"
      validation-path="item.terms.labels"
    />

    <!-- Descriptions Section -->
    <TermSection
      title="Descriptions"
      term-type="description"
      icon="pi pi-file-o"
      placeholder="Drop column for descriptions"
      test-id="description-drop-zone"
      validation-path="item.terms.descriptions"
    />

    <!-- Aliases Section -->
    <TermSection
      title="Aliases"
      term-type="alias"
      icon="pi pi-tags"
      placeholder="Drop column for aliases"
      test-id="alias-drop-zone"
      validation-path="item.terms.aliases"
    />
  </div>
</template>
