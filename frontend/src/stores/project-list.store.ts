import type { Project } from '@backend/api/project/schemas'

export const useProjectListStore = defineStore('projectList', () => {
  const api = useApi()

  // State
  const projects = ref<Project[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const hasProjects = computed(() => projects.value.length > 0)
  const projectCount = computed(() => projects.value.length)

  // Actions
  const fetchProjects = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.project.get()

      if (response.data?.data) {
        projects.value = response.data.data
      } else {
        projects.value = []
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch projects'
      projects.value = []
    } finally {
      isLoading.value = false
    }
  }

  const deleteProject = async (projectId: string) => {
    try {
      await api.project({ id: projectId }).delete()
      // Remove from local state
      projects.value = projects.value.filter((p) => p.id !== projectId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete project'
      throw err
    }
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
