<script setup lang="ts">
import { useHead } from '@unhead/vue'

useHead({
  title: 'OpenRefine - A power tool for working with messy data',
  meta: [
    {
      name: 'description',
      content:
        'OpenRefine is a free, open source power tool for working with messy data and improving it',
    },
  ],
})
</script>

<template>
  <router-view />
</template>
