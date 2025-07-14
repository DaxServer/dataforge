<script setup lang="ts">
const router = useRouter()
const route = useRoute()

const activeTab = useRouteParams('tab') as Ref<string>

const onTabChange = (value: string | number) => {
  activeTab.value = value as string
  router.replace({ name: route.name, params: { ...route.params, tab: value as string } })
}

const _tabs = {
  data: {
    key: 'data',
    label: 'Data',
    icon: 'pi pi-table',
  },
  schema: {
    key: 'schema',
    label: 'Schema',
    icon: 'pi pi-pencil',
  },
}
</script>

<template>
  <div class="-m-6 flex flex-col">
    <Tabs
      :value="activeTab"
      class="mb-8"
      @update:value="onTabChange"
    >
      <TabList>
        <Tab
          v-for="_tab in _tabs"
          :key="_tab.key"
          :value="_tab.key"
        >
          <i :class="_tab.icon" />
          {{ _tab.label }}
        </Tab>
      </TabList>
      <TabPanels>
        <TabPanel :value="_tabs.data.key">
          <DataTabPanel />
        </TabPanel>
        <TabPanel :value="_tabs.schema.key">
          <WikibaseSchemaEditor />
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>
