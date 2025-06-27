<script setup lang="ts"></script>

<template>
  <div class="flex h-screen w-full">
    <Sidebar />
    <div class="flex-1 flex flex-col min-w-0">
      <Header />
      <MainContent>
        <router-view v-slot="{ Component, route }">
          <transition
            name="fade"
            mode="out-in"
            :key="route.name"
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
