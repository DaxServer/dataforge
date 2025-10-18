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
    <Breadcrumb v-if="isProjectView" class="h-16 flex items-center justify-between p-4">
      <BreadcrumbList>
        <BreadcrumbItem class="text-lg font-semibold text-gray-900">
          {{ projectName || 'Loading Project...' }}
        </BreadcrumbItem>
        <BreadcrumbItem class="text-sm text-gray-600">{{ totalRecords }} rows</BreadcrumbItem>
      </BreadcrumbList>
      <router-link :to="{ name: 'open' }">
        <Button variant="outline">
          <LucideMoveLeft />
          Back to Projects
        </Button>
      </router-link>
    </Breadcrumb>

    <!-- Default Header for other views -->
    <Breadcrumb v-else class="h-16 flex items-center p-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          Projects
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          All Projects
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  </header>
</template>
