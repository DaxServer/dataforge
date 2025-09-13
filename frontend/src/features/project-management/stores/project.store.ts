import type { GetProjectByIdResponse } from "@backend/api/project/schemas"

export const useProjectStore = defineStore('project', () => {
  const api = useApi()
  const { showError } = useErrorHandling()
  const { generateColumns } = useColumnGeneration()

  // State
  const data = ref<GetProjectByIdResponse['data']>([])
  const meta = ref<GetProjectByIdResponse['meta']>({
    name: '',
    schema: [],
    total: 0,
    limit: 0,
    offset: 0,
  })
  const isLoading = ref(false)
  const columns = ref<ProjectColumn[]>([])

  // Actions
  const fetchProject = async (projectId: string, offset = 0, limit = 25) => {
    isLoading.value = true

    const { data: rows, error } = await api.project({ projectId }).get({ query: { offset, limit } })

    if (error) {
      showError(error.value)
      isLoading.value = false
      return
    }

    data.value = rows.data
    meta.value = rows.meta
    columns.value = generateColumns(rows.meta.schema)

    isLoading.value = false
  }

  const clearProject = () => {
    data.value = []
    meta.value = {
      name: '',
      schema: [],
      total: 0,
      limit: 0,
      offset: 0,
    }
    columns.value = []
    isLoading.value = false
  }

  const columnsForSchema = computed(() => {
    return columns.value.map((col) => {
      // Get all values for this column
      const columnValues = data.value.map((_row) => _row[col.field])

      // Filter non-null values and get unique set
      const nonNullValues = columnValues.filter((value) => value !== null && value !== undefined)
      const uniqueValues = new Set(nonNullValues)

      // Get sample values (first 5 unique string values)
      const sampleValues = [...uniqueValues].slice(0, 5).map((value) => String(value))

      return {
        name: col.field,
        dataType: col.type,
        sampleValues,
        nullable: columnValues.length > nonNullValues.length,
        uniqueCount: uniqueValues.size || undefined,
      }
    })
  })

  return {
    // State
    data,
    meta,
    isLoading,
    columns,
    columnsForSchema,

    // Actions
    fetchProject,
    clearProject,
  }
})
