<script setup lang="ts">
const projectId = useRouteParams('id') as Ref<string>

const projectStore = useProjectStore()
const { meta, isLoading, data, columns } = storeToRefs(projectStore)
const { fetchProject, clearProject } = projectStore
const { processHtml } = useHtml()

const totalRecords = computed(() => meta.value.total)

const handlePaginate = async (event: { offset: number; limit: number }) => {
  await fetchProject(projectId.value, event.offset, event.limit)
}

onUnmounted(() => clearProject())
</script>

<template>
  <CustomPaginator
    :total-records="totalRecords"
    :initial-rows="5"
    @paginate="handlePaginate"
  />

  <DataTable
    :value="data"
    :paginator="false"
    :loading="isLoading"
    table-class="text-sm"
    striped-rows
    show-gridlines
    scrollable
    scroll-height="flex"
  >
    <template #empty>
      <div class="text-center py-8">
        <i class="pi pi-info-circle text-4xl text-gray-400 mb-4" />
        <p class="text-gray-600">No data available in this project.</p>
      </div>
    </template>

    <Column
      v-for="col in columns"
      :key="col.field"
      :field="col.field"
      :pt="{
        headerCell: {
          class: `whitespace-nowrap p-2! min-w-20 max-w-100 ${col.pk ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`,
        },
        bodyCell: {
          class: `${col.isDate ? 'whitespace-nowrap' : 'whitespace-normal break-words'} align-top p-2! min-w-20 max-w-100 ${col.isInteger ? 'text-end!' : ''} ${col.pk ? 'bg-blue-25 border-l-4 border-l-blue-500' : ''}`,
        },
      }"
    >
      <template #header>
        <div class="flex items-center font-bold gap-2">
          <i
            v-if="col.pk"
            class="pi pi-key text-blue-600"
          />
          <ColumnHeaderMenu
            v-if="!col.pk"
            :column-field="col.field"
            :column-header="col.header"
            :is-primary-key="col.pk"
          />
          <span>{{ col.header }}</span>
        </div>
      </template>
      <template #body="slotProps">
        <span
          :class="{
            'text-green-600 font-medium': col.isInteger,
          }"
          v-html="processHtml(slotProps.data[col.field])"
        />
      </template>
    </Column>
  </DataTable>
</template>
