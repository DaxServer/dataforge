<script setup lang="ts"></script>

<template>
  <div class="terms-editor space-y-6">
    <!-- Labels Section -->
    <div class="border border-surface-200 rounded-lg p-4">
      <h3 class="text-lg font-semibold mb-3">Labels</h3>
      <LanguageDropZone
        term-type="label"
        icon="pi pi-tag"
        placeholder="Drop column for labels"
        test-id="label-drop-zone"
      />
    </div>

    <!-- Descriptions Section -->
    <div class="border border-surface-200 rounded-lg p-4">
      <h3 class="text-lg font-semibold mb-3">Descriptions</h3>
      <LanguageDropZone
        term-type="description"
        icon="pi pi-file-o"
        placeholder="Drop column for descriptions"
        test-id="description-drop-zone"
      />
    </div>

    <!-- Aliases Section -->
    <div class="border border-surface-200 rounded-lg p-4">
      <h3 class="text-lg font-semibold mb-3">Aliases</h3>
      <LanguageDropZone
        term-type="alias"
        icon="pi pi-tags"
        placeholder="Drop column for aliases"
        test-id="alias-drop-zone"
      />
    </div>
  </div>
</template>
