<script setup lang="ts">
import { LucideFolderOpen, LucidePlus } from 'lucide-vue-next'

const route = useRoute()

// Hide sidebar when viewing a project
const showSidebar = computed(() => {
  return route.name !== 'ProjectView'
})

const navItems = [
  {
    name: 'Open',
    icon: LucideFolderOpen,
    to: '/open',
  },
  {
    name: 'Create Project',
    icon: LucidePlus,
    to: '/create',
  },
]
</script>

<template>
  <div class="flex h-screen w-full">
    <SidebarProvider>
      <Sidebar v-if="showSidebar">
        <SidebarHeader>
          <SidebarMenuButton size="lg"><h1 class="text-xl font-semibold text-gray-800">DataForge</h1></SidebarMenuButton>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem v-for="item in navItems" :key="item.name" :item="item">
                  <SidebarMenuButton
                  as-child
                  size="lg"
                  :item="item"
                  :is-active="route.path.endsWith(item.to)"
                  >
                  <router-link :to="item.to">
                    <component :is="item.icon" />
                    {{ item.name }}
                  </router-link>
                </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <Header />
        <MainContent>
          <router-view v-slot="{ Component, route }">
            <transition
              :key="route.name"
              name="fade"
              mode="out-in"
            >
              <component :is="Component" />
            </transition>
          </router-view>
        </MainContent>
      </SidebarInset>
    </SidebarProvider>

    <!-- Global Toast and Confirm Dialog -->
    <Toast />
    <ConfirmDialog />
  </div>
</template>
