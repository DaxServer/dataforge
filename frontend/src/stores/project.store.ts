import { ErrorResponseWithData } from '@backend/types/error-schemas'
import type { GetProjectByIdResponse } from '@backend/api/project/project.get'
import { DuckDBColumnSchema } from '@backend/api/project/_schemas'

export const useProjectStore = defineStore('project', () => {
  const api = useApi()

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
  const columns = ref<any[]>([])
  const errorState = ref<string | null>(null)

  // Helper functions
  const handleApiError = (error: ErrorResponseWithData) => {
    errorState.value = error.errors.map((err) => err.message).join(', ')
    isLoading.value = false
  }

  const generateColumns = (schema: DuckDBColumnSchema) => {
    return schema.map((col) => ({
      field: col.name,
      header: col.name,
      type: col.type,
      isInteger: col.type === 'integer',
      isDate: col.type === 'date',
    }))
  }

  // Actions
  const fetchProject = async (projectId: string, offset: number = 0, limit: number = 25) => {
    errorState.value = null
    isLoading.value = true

    const { data: rows, error } = await api.project({ id: projectId }).get({
      query: { offset, limit },
    })

    if (error || rows === null) {
      handleApiError(error.value)
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
    errorState.value = null
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
    clearProject,
  }
})
