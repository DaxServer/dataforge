import type { GetProjectByIdResponse } from '@backend/api/project/project.get'
import { DuckDBColumnSchema } from '@backend/api/project/_schemas'

export const useProjectStore = defineStore('project', () => {
  const api = useApi()
  const { showError } = useErrorHandling()

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
    isLoading.value = true

    const { data: rows, error } = await api
      .project({ id: projectId })
      .get({ query: { offset, limit } })

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

  return {
    // State
    data,
    meta,
    isLoading,
    columns,

    // Actions
    fetchProject,
    clearProject,
  }
})
