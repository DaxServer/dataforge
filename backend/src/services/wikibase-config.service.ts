import type { WikibaseInstanceConfig } from '@backend/types/wikibase-api'

export class WikibaseConfigService {
  private instances: Record<string, WikibaseInstanceConfig> = {
    wikidata: {
      id: 'wikidata',
      name: 'Wikidata',
      baseUrl: 'https://www.wikidata.org/w/rest.php/wikibase/v1',
      userAgent: 'DataForge/1.0 (https://github.com/DaxServer/dataforge)',
    },
  }

  getInstances(): WikibaseInstanceConfig[] {
    return Object.values(this.instances)
  }

  getInstance(instanceId: string): WikibaseInstanceConfig {
    if (!this.instances[instanceId]) {
      throw new Error(`Instance not found: ${instanceId}`)
    }

    return this.instances[instanceId]
  }

  addInstance(config: WikibaseInstanceConfig): void {
    if (this.instances[config.id]) {
      throw new Error(`Instance with ID '${config.id}' already exists`)
    }

    this.instances[config.id] = config
  }

  updateInstance(instanceId: string, config: Partial<WikibaseInstanceConfig>): void {
    const existingInstance = this.getInstance(instanceId)
    const updatedConfig = { ...existingInstance, ...config, id: instanceId }

    this.instances[instanceId] = updatedConfig
  }

  removeInstance(instanceId: string): void {
    if (!this.instances[instanceId]) {
      throw new Error(`Custom instance not found: ${instanceId}`)
    }

    delete this.instances[instanceId]
  }
}

// Export a singleton instance
export const wikibaseConfigService = new WikibaseConfigService()
