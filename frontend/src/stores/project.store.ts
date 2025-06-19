import type { GetProjectByIdSchema } from '@backend/api/project/schemas'

export const useProjectStore = defineStore('project', () => {
  const api = useApi()

  // State
  const data = ref<(typeof GetProjectByIdSchema.response)['200']['data'] | null>(null)
  const meta = ref<(typeof GetProjectByIdSchema.response)['200']['meta'] | {}>({})
  const isLoading = ref(false)
  const columns = ref<any[]>([])
  const errorState = ref<string | null>(null)

  // Actions
  const fetchProject = async (projectId: string) => {
    errorState.value = null
    isLoading.value = true

    data.value = []
    columns.value = []

    const { data: rows, error } = await api.project({ id: projectId }).get()

    if (error) {
      errorState.value = error.value?.message || 'An unknown error occurred'
      isLoading.value = false
      return
    }

    data.value = rows.data
    meta.value = rows.meta

    // Generate columns from first row if data exists
    if (rows.data && rows.data.length > 0) {
      const firstRow = rows.data[0]
      columns.value = Object.keys(firstRow).map((key) => ({
        field: key,
        header: key.charAt(0).toUpperCase() + key.slice(1),
      }))
    }

    isLoading.value = false
  }

  const resetState = () => {
    data.value = []
    meta.value = {}
    isLoading.value = false
    columns.value = []
    errorState.value = null
  }

  const clearProject = () => {
    resetState()
  }

  return {
    // State
    data,
    meta,
    isLoading,
    columns,
    errorState,

    // Actions
    fetchProject,
    resetState,
    clearProject,
  }
})
