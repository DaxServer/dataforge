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

    if (error || rows === null) {
      errorState.value = error.value?.message || 'An unknown error occurred'
      isLoading.value = false
      return
    }

    data.value = rows.data
    meta.value = rows.meta

    // Generate columns from schema
    columns.value = rows.meta.schema.map((col: { name: string; type: string }) => ({
      field: col.name,
      header: col.name,
      type: col.type,
      isInteger: col.type === 'integer',
      isDate: col.type === 'date',
    }))

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
