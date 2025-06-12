import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { PrimeVueResolver } from '@primevue/auto-import-resolver'
import { defineConfig } from 'vite'
import VueDevTools from 'vite-plugin-vue-devtools'
import PackageJson from './package.json' with { type: 'json' }
import tsconfigPaths from 'vite-tsconfig-paths'

process.env.VITE_APP_VERSION = PackageJson.version
if (process.env.NODE_ENV === 'production') {
  process.env.VITE_APP_BUILD_EPOCH = new Date().getTime().toString()
}

export default defineConfig({
  // resolve: {
  //   alias: {
  //     '@': fileURLToPath(new URL('./src', import.meta.url)),
  //   },
  // },
  plugins: [
    VueDevTools(),
    vue(),
    tsconfigPaths(),
    tailwindcss(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      dts: true,
      dirs: ['src/plugins', 'src/stores'],
      vueTemplate: true,
      resolvers: [PrimeVueResolver()],
      eslintrc: {
        enabled: true,
      },
    }),
    Components({
      dirs: ['src/*'],
      dts: true,
      resolvers: [PrimeVueResolver()],
    }),
  ],
  css: {
    preprocessorMaxWorkers: true,
  },
  server: {
    proxy: {
      '/project': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
