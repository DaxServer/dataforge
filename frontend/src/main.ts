import { createApp, markRaw, type Component } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@unhead/vue/client'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import 'primeicons/primeicons.css'

// Import your router and app
import router from '@frontend/router'
import App from '@frontend/App.vue'

// Import global styles
import '@frontend/assets/base.css'

// Import API plugin
import { ApiPlugin } from '@frontend/plugins/api'

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

// Mount the app
app.mount('#app')
