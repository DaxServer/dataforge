<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

// Sidebar navigation items for OpenRefine
const navItems = [
  {
    name: 'Open',
    icon: 'pi pi-folder-open',
    to: '/open',
  },
  {
    name: 'Create Project',
    icon: 'pi pi-plus',
    to: '/create',
  },
]
</script>

<template>
  <div class="w-64 h-full bg-white border-r border-gray-200 flex-shrink-0">
    <!-- Logo/App Name -->
    <div class="p-4 border-b border-gray-200">
      <h1 class="text-xl font-semibold text-gray-800">OpenRefine</h1>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto p-2">
      <ul class="space-y-1">
        <li
          v-for="item in navItems"
          :key="item.name"
          class="group"
        >
          <router-link
            :to="item.to"
            class="flex items-center px-3 py-2 text-sm font-medium rounded-md group-hover:bg-gray-100 text-gray-700 hover:text-gray-900"
            :class="{ 'bg-gray-100 text-gray-900': route.path.endsWith(item.to) }"
          >
            <i
              :class="[
                item.icon,
                'mr-3',
                route.path.endsWith(item.to)
                  ? 'text-gray-900'
                  : 'text-gray-400 group-hover:text-gray-500',
              ]"
            ></i>
            {{ item.name }}
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- Footer -->
    <div class="p-4 border-t border-gray-200 text-xs text-gray-500">
      <p>OpenRefine</p>
    </div>
  </div>
</template>
