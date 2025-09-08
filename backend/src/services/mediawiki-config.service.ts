import type { MediaWikiInstanceConfig } from '@backend/types/mediawiki-api'

export class MediaWikiConfigService {
  private instances: Record<string, MediaWikiInstanceConfig> = {
    wikidata: {
      id: 'wikidata',
      name: 'Wikidata',
      endpoint: 'https://www.wikidata.org/w/api.php',
      userAgent: 'DataForge/1.0 (https://github.com/DaxServer/dataforge)',
      timeout: 30000,
    },
    commons: {
      id: 'commons',
      name: 'Wikimedia Commons',
      endpoint: 'https://commons.wikimedia.org/w/api.php',
      userAgent: 'DataForge/1.0 (https://github.com/DaxServer/dataforge)',
      timeout: 30000,
    },
  }

  /**
   * Get all available instances (pre-defined + custom)
   */
  getInstances(): MediaWikiInstanceConfig[] {
    return Object.values(this.instances)
  }

  /**
   * Get a specific instance by ID
   */
  getInstance(instanceId: string): MediaWikiInstanceConfig {
    const instance = this.instances[instanceId]
    if (!instance) {
      throw new Error(`Instance with ID '${instanceId}' not found`)
    }
    return instance
  }

  /**
   * Add a new custom instance
   */
  addInstance(config: MediaWikiInstanceConfig): void {
    if (this.instances[config.id]) {
      throw new Error(`Instance with ID '${config.id}' already exists`)
    }
    this.instances[config.id] = { ...config }
  }

  /**
   * Update an existing instance
   */
  updateInstance(instanceId: string, config: Partial<MediaWikiInstanceConfig>): void {
    const existingInstance = this.getInstance(instanceId)
    const updatedInstance = { ...existingInstance, ...config, id: instanceId }

    if (this.instances[instanceId]) {
      this.instances[instanceId] = updatedInstance
    } else {
      throw new Error(`Instance with ID '${instanceId}' not found`)
    }
  }

  /**
   * Remove a custom instance
   */
  removeInstance(instanceId: string): void {
    if (this.instances[instanceId]) {
      throw new Error(`Cannot remove predefined instance '${instanceId}'`)
    }

    if (!this.instances[instanceId]) {
      throw new Error(`Instance '${instanceId}' not found`)
    }

    delete this.instances[instanceId]
  }
}

// Default instance
export const mediaWikiConfigService = new MediaWikiConfigService()
