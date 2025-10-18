<script setup lang="ts">
import {
  LucideFolderOpen,
  LucideLoader2,
  LucidePlus,
  LucideRefreshCcw,
  LucideTrash,
} from 'lucide-vue-next'

const projectsListStore = useProjectListStore()
const { deleteProject, formatDate } = useProjectListComposable()
const { hasProjects, projectCount, isLoading, projects } = storeToRefs(projectsListStore)
const { fetchProjects } = projectsListStore

// Load projects when component mounts
onMounted(async () => {
  await fetchProjects()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border-b border-gray-200 pb-5">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-semibold text-gray-900">
            Open Project
            <span
              v-if="hasProjects"
              class="text-lg font-normal text-gray-600 ml-2"
            >
              ({{ projectCount }})
            </span>
          </h2>
          <p class="mt-2 text-sm text-gray-600">Select from your existing projects.</p>
        </div>
        <div class="flex items-center space-x-3">
          <Button
            variant="outline"
            :disabled="isLoading"
            @click="fetchProjects"
          >
            <LucideLoader2 v-if="isLoading" class="animate-spin" />
            <LucideRefreshCcw v-else />
            Refresh<template v-if="isLoading">ing</template>
          </Button>
          <router-link :to="{ name: 'create' }">
            <Button>
              <LucidePlus />
              Create New
            </Button>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading && !hasProjects"
      class="flex justify-center py-12"
    >
      <ProgressSpinner />
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!hasProjects && !isLoading"
      class="flex flex-col items-center justify-center py-12"
    >
      <LucideFolderOpen :size="32" class="text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
      <p class="mt-1 text-sm text-gray-500">Get started by creating your first project.</p>
      <div class="mt-6">
        <router-link :to="{ name: 'create' }">
          <Button>
            <LucidePlus />
            Create New Project
          </Button>
        </router-link>
      </div>
    </div>

    <!-- Projects DataTable -->
    <div
      v-else
      class="bg-white shadow sm:rounded-lg"
    >
      <DataTable
        :value="projects"
        :loading="isLoading"
        :paginator="projectCount > 10"
        :rows="10"
        paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rows-per-page-options="[5, 10, 25, 50]"
        current-page-report-template="Showing {first} to {last} of {totalRecords} projects"
        sort-field="updated_at"
        :sort-order="-1"
        class="p-datatable-sm"
        :row-hover="true"
      >
        <Column
          field="name"
          header="Project Name"
          sortable
        >
          <template #body="{ data }">
            <router-link :to="{ name: 'ProjectView', params: { id: data.id, tab: 'data' } }">
              <div class="flex items-center space-x-3 group">
                <i class="pi pi-file text-lg text-blue-600" />
                <span
                  class="font-medium text-gray-900 cursor-pointer group-hover:text-blue-600 group-hover:underline"
                >
                  {{ data.name }}
                </span>
              </div>
            </router-link>
          </template>
        </Column>

        <Column
          field="created_at"
          header="Created"
          sortable
        >
          <template #body="{ data }">
            <span class="text-sm text-gray-600">{{ formatDate(data.created_at) }}</span>
          </template>
        </Column>

        <Column
          field="updated_at"
          header="Last Updated"
          sortable
        >
          <template #body="{ data }">
            <span class="text-sm text-gray-600">{{ formatDate(data.updated_at) }}</span>
          </template>
        </Column>

        <Column :exportable="false">
          <template #body="{ data }">
            <div class="flex items-center justify-center">
              <Button
                variant="destructive"
                size="sm"
                class="p-button-sm delete-button"
                @click="deleteProject(data)"
              >
                <LucideTrash />
              </Button>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
