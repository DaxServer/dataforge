import type { Project } from '@backend/api/project/_schemas'

export const useProjectListStore = defineStore('project.list', () => {
  const api = useApi()
  const { showError } = useErrorHandling()

  // State
  const projects = ref<Project[]>([])
  const isLoading = ref(false)

  // Actions
  const fetchProjects = async () => {
    isLoading.value = true

    const { data, error: apiError } = await api.project.get()

    if (apiError) {
      showError(apiError.value as any)
    } else {
      projects.value = (data as any).data
    }

    isLoading.value = false
  }

  const deleteProject = async (projectId: string) => {
    isLoading.value = true

    const { error: apiError } = await api.project({ projectId }).delete()

    if (apiError) {
      showError(apiError.value as any)
      isLoading.value = false
      return
    }

    // Remove from local state
    projects.value = projects.value.filter((p) => p.id !== projectId)
    isLoading.value = false
  }

  const resetState = () => {
    projects.value = []
    isLoading.value = false
  }

  return {
    // State
    projects,
    isLoading,

    // Getters
    hasProjects: computed(() => projects.value.length > 0),
    projectCount: computed(() => projects.value.length),

    // Actions
    fetchProjects,
    deleteProject,
    resetState,
  }
})
