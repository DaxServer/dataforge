<script setup lang="ts">
const route = useRoute()

// Hide sidebar when viewing a project
const showSidebar = computed(() => {
  return route.name !== 'ProjectView'
})
</script>

<template>
  <div class="flex h-screen w-full">
    <Sidebar v-if="showSidebar" />
    <div class="flex-1 flex flex-col min-w-0">
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
    </div>

    <!-- Global Toast and Confirm Dialog -->
    <Toast />
    <ConfirmDialog />
  </div>
</template>
