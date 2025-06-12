<script setup lang="ts"></script>

<template>
  <div class="flex h-screen w-full">
    <Sidebar />
    <div class="flex-1 flex flex-col min-w-0">
      <Header />
      <MainContent>
        <router-view v-slot="{ Component }">
          <transition
            name="fade"
            mode="out-in"
          >
            <component :is="Component" />
          </transition>
        </router-view>
      </MainContent>
    </div>
  </div>
</template>
