import type { Project } from '@backend/api/project/_schemas'

export const useProjectListStore = defineStore('projectList', () => {
  const api = useApi()
  const { showError } = useErrorHandling()

  // State
  const projects = ref<Project[]>([])
  const isLoading = ref(false)

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

    const { data, error: apiError } = await api.project.get()
    if (apiError) {
      showError(apiError.value)
      projects.value = []
    } else {
      projects.value = data.data
    }
    isLoading.value = false
  }

  const deleteProject = async (projectId: string) => {
    const { error: apiError } = await api.project({ id: projectId }).delete()
    if (apiError) {
      showError(apiError.value)
      return
    }
    // Remove from local state
    projects.value = projects.value.filter((p) => p.id !== projectId)
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
    hasProjects,
    projectCount,

    // Actions
    fetchProjects,
    deleteProject,
    resetState,
  }
})
