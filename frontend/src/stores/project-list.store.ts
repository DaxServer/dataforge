import type { Project } from '@backend/api/project/schemas'

export const useProjectListStore = defineStore('projectList', () => {
  const api = useApi()

  // State
  const projects = ref<Project[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const hasProjects = ref(false)
  const projectCount = ref(0)

  // Update reactive getters when projects change
  watch(
    projects,
    (newProjects) => {
      hasProjects.value = newProjects.length > 0
      projectCount.value = newProjects.length
    },
    { immediate: true }
  )

  // Actions
  const fetchProjects = async () => {
    isLoading.value = true
    error.value = null

    const { data, error: apiError } = await api.project.get()
    if (apiError) {
      error.value = 'Failed to fetch projects'
      projects.value = []
    } else {
      projects.value = data.data
    }
    isLoading.value = false
  }

  const deleteProject = async (projectId: string) => {
    const { error: apiError } = await api.project({ id: projectId }).delete()
    if (apiError) {
      error.value =
        (apiError.value && 'message' in apiError.value
          ? apiError.value.message
          : apiError.value?.errors?.[0]?.message) || 'Failed to delete project'
      return
    }
    // Remove from local state
    projects.value = projects.value.filter((p) => p.id !== projectId)
  }

  const clearError = () => {
    error.value = null
  }

  const resetState = () => {
    projects.value = []
    isLoading.value = false
    error.value = null
  }

  return {
    // State
    projects,
    isLoading,
    error,

    // Getters
    hasProjects,
    projectCount,

    // Actions
    fetchProjects,
    deleteProject,
    clearError,
    resetState,
  }
})
