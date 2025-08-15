import { ref } from 'vue'

/**
 * Composable for handling term editor functionality
 */
export const useTermsEditor = () => {
  // Hardcoded accepted languages
  const ACCEPTED_LANGUAGES = ['en', 'de', 'it', 'fr', 'es', 'pt']

  // Reactive state
  const showLanguageInput = ref(false)
  const newLanguageCode = ref('')
  const selectedLanguage = ref('en')

  /**
   * Language validation - check if code is in accepted languages
   * @param code - The language code to validate
   * @returns True if the language code is accepted
   */
  const isValidLanguageCode = (code: string): boolean => {
    return ACCEPTED_LANGUAGES.includes(code)
  }

  /**
   * Get list of accepted languages
   * @returns Array of accepted language codes
   */
  const getAcceptedLanguages = (): string[] => {
    return [...ACCEPTED_LANGUAGES]
  }

  /**
   * Show the language input field
   */
  const showAddLanguage = (): void => {
    showLanguageInput.value = true
  }

  /**
   * Add a new language
   */
  const addLanguage = (): void => {
    if (isValidLanguageCode(newLanguageCode.value)) {
      // Language will be added when a column is dropped
      showLanguageInput.value = false
      newLanguageCode.value = ''
    }
  }

  /**
   * Hide the language input field
   */
  const hideLanguageInput = (): void => {
    showLanguageInput.value = false
  }

  return {
    // State
    showLanguageInput,
    newLanguageCode,
    selectedLanguage,

    // Methods
    isValidLanguageCode,
    getAcceptedLanguages,
    showAddLanguage,
    addLanguage,
    hideLanguageInput,
  }
}
