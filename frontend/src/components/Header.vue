<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <header class="h-16 bg-white border-b border-gray-200 flex-shrink-0 flex items-center px-6">
    <!-- Breadcrumb -->
    <div class="flex items-center text-sm">
      <span class="text-gray-500">Projects</span>
      <i class="pi pi-angle-right mx-2 text-gray-400"></i>
      <span class="font-medium text-gray-900">{{ route.meta.title || 'Untitled Project' }}</span>
    </div>

    <!-- Spacer -->
    <div class="flex-1"></div>

    <!-- Actions -->
    <div class="flex items-center space-x-4">
      <Button
        icon="pi pi-cog"
        text
        rounded
        severity="secondary"
        aria-label="Settings"
      />
      <Button
        icon="pi pi-question-circle"
        text
        rounded
        severity="secondary"
        aria-label="Help"
      />
      <Button
        icon="pi pi-user"
        text
        rounded
        severity="secondary"
        aria-label="User"
      />
    </div>
  </header>
</template>
