<script setup lang="ts">
const { loadProjects, openProject, deleteProject, formatDate } = useProjectListComposable()
const { hasProjects, projectCount, isLoading, projects } = storeToRefs(useProjectListStore())

// Load projects when component mounts
onMounted(() => {
  loadProjects()
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
            icon="pi pi-refresh"
            label="Refresh"
            severity="secondary"
            outlined
            @click="loadProjects"
            :loading="isLoading"
          />
          <Button
            icon="pi pi-plus"
            label="Create New"
            @click="$router.push('/create')"
          />
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
      class="text-center py-12"
    >
      <div class="mx-auto h-12 w-12 text-gray-400">
        <i class="pi pi-folder-open text-4xl"></i>
      </div>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
      <p class="mt-1 text-sm text-gray-500">Get started by creating your first project.</p>
      <div class="mt-6">
        <Button
          icon="pi pi-plus"
          label="Create New Project"
          @click="$router.push('/create')"
        />
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
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[5, 10, 25, 50]"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} projects"
        sortField="updated_at"
        :sortOrder="-1"
        class="p-datatable-sm"
        :rowHover="true"
      >
        <Column
          field="name"
          header="Project Name"
          sortable
        >
          <template #body="{ data }">
            <div
              class="flex items-center space-x-3 hover:text-blue-600 transition-colors"
              @click="openProject(data.id)"
            >
              <i class="pi pi-file text-lg text-blue-600"></i>
              <span
                class="font-medium text-gray-900 cursor-pointer hover:text-blue-600 hover:underline transition-all"
              >
                {{ data.name }}
              </span>
            </div>
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
                icon="pi pi-trash"
                severity="danger"
                outlined
                size="small"
                @click="deleteProject(data)"
                class="p-button-sm delete-button"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
