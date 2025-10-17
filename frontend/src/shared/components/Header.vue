<script setup lang="ts">
import { LucideMoveLeft } from 'lucide-vue-next'

const projectId = useRouteParams('id')
const { meta } = storeToRefs(useProjectStore())

const isProjectView = computed(() => !!projectId.value)
const projectName = computed(() => meta.value?.name)
const totalRecords = computed(() => meta.value?.total || 0)
</script>

<template>
  <header class="bg-white border-b border-gray-200 flex-shrink-0">
    <!-- Project Header for Project View -->
    <div
      v-if="isProjectView"
      class="h-16 flex items-center justify-between p-4"
    >
      <div>
        <h1 class="text-xl font-semibold text-gray-900">
          {{ projectName || 'Loading Project...' }}
        </h1>
        <p class="text-sm text-gray-600">{{ totalRecords }} rows</p>
      </div>
      <div class="flex gap-2">
        <router-link :to="{ name: 'open' }">
          <Button variant="outline">
            <LucideMoveLeft />
            Back to Projects
          </Button>
        </router-link>
      </div>
    </div>

    <!-- Default Header for other views -->
    <div
      v-else
      class="h-16 flex items-center p-4"
    >
      <!-- Breadcrumb -->
      <div class="flex items-center text-sm">
        <span class="text-gray-500">Projects</span>
        <i class="pi pi-angle-right mx-2 text-gray-400" />
        <span class="font-medium text-gray-900">All Projects</span>
      </div>

      <!-- Spacer -->
      <div class="flex-1" />

      <!-- Actions -->
    </div>
  </header>
</template>
