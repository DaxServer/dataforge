<script setup lang="ts">
import { useHead } from '@unhead/vue'

useHead({
  title: 'DataForge',
  meta: [
    {
      name: 'description',
      content:
        'DataForge is a free, open source power tool for working with messy data and improving it',
    },
  ],
})
</script>

<template>
  <router-view />
</template>
