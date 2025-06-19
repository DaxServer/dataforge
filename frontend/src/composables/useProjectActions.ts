export const useProjectActions = () => {
  const router = useRouter()

  const goBack = () => {
    router.back()
  }

  return {
    goBack,
  }
}
