export const useProjectListComposable = () => {
  const store = useProjectListStore()
  const router = useRouter()
  const confirm = useConfirm()
  const { showSuccess } = useErrorHandling()

  // Load projects when composable is used
  const loadProjects = async () => {
    await store.fetchProjects()
  }

  // Open a project (navigate to project view)
  const openProject = (projectId: string) => {
    router.push({ name: 'ProjectView', params: { id: projectId } })
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
        await store.deleteProject(project.id)
        showSuccess(`Project "${project.name}" has been deleted`)
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

  return {
    // Actions
    loadProjects,
    openProject,
    deleteProject,
    formatDate,
  }
}
