<script setup lang="ts">
const { totalRecords, initialRows = 5 } = defineProps<{
  totalRecords: number
  initialRows?: number
}>()

const emit = defineEmits<{
  paginate: [{ offset: number; limit: number }]
}>()

// Internal pagination state
const currentPage = ref(0)
const rowsPerPage = ref(initialRows)

// Computed properties for template calculations
const first = computed(() => currentPage.value * rowsPerPage.value)

// Handle page change from PrimeVue Paginator
const onPageChange = (event: PageState) => {
  rowsPerPage.value = event.rows
  currentPage.value = Math.floor(event.first / event.rows)
  emit('paginate', { offset: event.first, limit: event.rows })
}

// Initialize with first fetch
onMounted(() => {
  emit('paginate', { offset: 0, limit: rowsPerPage.value })
})
</script>

<template>
  <Paginator
    :first="first"
    :rows="rowsPerPage"
    :total-records="totalRecords"
    :rows-per-page-options="[5, 10, 20, 50, 100]"
    template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
    current-page-report-template="Showing {first} to {last} of {totalRecords} entries"
    @page="onPageChange"
  >
    <template #end>
      <span class="text-sm text-gray-500">
        Page {{ Math.floor(first / rowsPerPage) + 1 }} of
        {{ Math.ceil(totalRecords / rowsPerPage) }}
      </span>
    </template>
  </Paginator>
</template>
