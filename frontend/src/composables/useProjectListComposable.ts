export const useProjectListComposable = () => {
  const store = useProjectListStore()
  const router = useRouter()
  const confirm = useConfirm()
  const toast = useToast()

  const { projects, isLoading, error, hasProjects, projectCount } = storeToRefs(store)

  // Load projects when composable is used
  const loadProjects = async () => {
    await store.fetchProjects()

    if (error.value) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.value,
        life: 5000,
      })
    }
  }

  // Open a project (navigate to project view)
  const openProject = (projectId: string) => {
    router.push(`/projects/${projectId}`)
  }

  // Delete a project with confirmation
  const deleteProject = (project: { id: string; name: string }) => {
    confirm.require({
      message: `Are you sure you want to delete the project "${project.name}"? This action cannot be undone.`,
      header: 'Delete Project',
      icon: 'pi pi-exclamation-triangle',
      rejectProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
      },
      acceptProps: {
        label: 'Delete',
        severity: 'danger',
      },
      accept: async () => {
        try {
          await store.deleteProject(project.id)
          toast.add({
            severity: 'success',
            summary: 'Success',
            detail: `Project "${project.name}" has been deleted`,
            life: 3000,
          })
        } catch (err) {
          toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete project',
            life: 5000,
          })
        }
      },
    })
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Clear any errors
  const clearError = () => {
    store.clearError()
  }

  return {
    // State
    projects,
    isLoading,
    error,
    hasProjects,
    projectCount,

    // Actions
    loadProjects,
    openProject,
    deleteProject,
    formatDate,
    clearError,
  }
}
