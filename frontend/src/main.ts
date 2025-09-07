import Aura from '@primeuix/themes/aura'
import { createHead } from '@unhead/vue/client'
import { createPinia } from 'pinia'
import 'primeicons/primeicons.css'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'
import { createApp, markRaw, type Component } from 'vue'

// Import your router and app
import App from '@frontend/App.vue'
import router from '@frontend/core/router/router'

// Import global styles
import '@frontend/assets/base.css'

// Import API plugin
import { ApiPlugin } from '@frontend/core/plugins/api'

const head = createHead()
const app = createApp(App as Component)

// Initialize Pinia
const pinia = createPinia()
pinia.use(({ store }) => {
  store.router = markRaw(router)
})

// Configure PrimeVue with Aura theme
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: 'none', // Disable dark mode
    },
  },
})

// Add plugins
app.use(router)
app.use(pinia)
app.use(head)
app.use(ApiPlugin)
app.use(ToastService)
app.use(ConfirmationService)

// Mount the app
app.mount('#app')
