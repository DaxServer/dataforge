import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
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
  plugins: [
    VueDevTools(),
    vue(),
    tsconfigPaths(),
    tailwindcss(),
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        'pinia',
        '@vueuse/core',
        {
          from: '@vueuse/router',
          imports: ['useRouteParams'],
        },
        {
          from: 'primevue/fileupload',
          imports: ['FileUploadUploaderEvent'],
          type: true,
        },
        {
          from: 'primevue/paginator',
          imports: ['PageState'],
          type: true,
        },
        {
          from: 'primevue/useconfirm',
          imports: ['useConfirm'],
        },
        {
          from: 'primevue/usetoast',
          imports: ['useToast'],
        },
      ],
      dts: true,
      dirs: ['src/**'],
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
  clearScreen: false,
})
