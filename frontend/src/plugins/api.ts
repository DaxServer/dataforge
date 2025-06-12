import { treaty } from '@elysiajs/eden'
import { type App as ElysiaApp } from '@backend/index'
import { type App as VueApp, inject, type InjectionKey } from 'vue'

type ApiClient = ReturnType<typeof treaty<ElysiaApp>>

// Injection key for the API client
export const ApiKey: InjectionKey<ApiClient> = Symbol('api')

// Composable to use the API client
export const useApi = (): ApiClient['api'] => {
  const api = inject(ApiKey)
  if (!api) {
    throw new Error('API client not provided. Make sure to install the API plugin.')
  }
  return api.api
}

// Vue plugin for the API client
export const ApiPlugin = {
  install(app: VueApp, options: { baseUrl?: string } = {}) {
    const baseUrl = options.baseUrl || 'http://localhost:3000'
    const apiClient = treaty<ElysiaApp>(baseUrl)

    // Provide the API client globally
    app.provide(ApiKey, apiClient)

    // Also make it available as a global property
    app.config.globalProperties.$api = apiClient.api
  },
}

// Export the api constant for backward compatibility with auto-imports
export const api = () => {
  // This will be used by auto-imports, but in components use useApi() instead
  return treaty<ElysiaApp>('http://localhost:3000').api
}
