export const useProjectActions = () => {
  const router = useRouter()

  const goToProjectsList = () => {
    router.push({ name: 'open' })
  }

  return {
    goToProjectsList,
  }
}
