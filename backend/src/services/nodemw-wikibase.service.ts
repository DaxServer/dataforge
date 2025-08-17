import nodemw from 'nodemw'
import type {
  WikibaseInstanceConfig,
  NodemwWikibaseInstanceConfig,
} from '@backend/types/wikibase-api'

/**
 * Wikibase API Service using nodemw for comprehensive MediaWiki API coverage
 */
export class NodemwWikibaseService {
  private clients: Map<string, nodemw> = new Map()
  private wikidataClients: Map<string, nodemw> = new Map()
  private instances: Map<string, NodemwWikibaseInstanceConfig> = new Map()

  /**
   * Create a new nodemw client for the given instance configuration
   */
  createClient(instanceConfig: NodemwWikibaseInstanceConfig): nodemw {
    const nodemwConfig = instanceConfig.nodemwConfig || this.getDefaultNodemwConfig(instanceConfig)

    const client = new nodemw(nodemwConfig)

    // Configure authentication if provided
    if (instanceConfig.authToken) {
      // For OAuth or token-based authentication, we'll handle this through login
      // or by setting appropriate headers in API calls
    }

    this.clients.set(instanceConfig.id, client)
    this.instances.set(instanceConfig.id, instanceConfig)

    return client
  }

  /**
   * Get an existing client for the given instance ID
   */
  getClient(instanceId: string): nodemw {
    const client = this.clients.get(instanceId)
    if (!client) {
      throw new Error(`No client found for instance: ${instanceId}`)
    }
    return client
  }

  /**
   * Get or create a Wikidata client for constraint validation
   */
  getWikidataClient(instanceId: string): nodemw {
    let wikidataClient = this.wikidataClients.get(instanceId)

    if (!wikidataClient) {
      // Create a dedicated Wikidata client for constraint validation
      const wikidataConfig = {
        protocol: 'https' as const,
        server: 'www.wikidata.org',
        path: '/w',
        userAgent: this.instances.get(instanceId)?.userAgent || 'DataForge/1.0',
        concurrency: 2, // Conservative concurrency for Wikidata
        debug: false,
      }

      wikidataClient = new nodemw(wikidataConfig)
      this.wikidataClients.set(instanceId, wikidataClient)
    }

    return wikidataClient
  }

  /**
   * Get instance configuration by ID
   */
  getInstance(instanceId: string): NodemwWikibaseInstanceConfig {
    const instance = this.instances.get(instanceId)
    if (!instance) {
      throw new Error(`No instance configuration found for: ${instanceId}`)
    }
    return instance
  }

  /**
   * Check if a client exists for the given instance ID
   */
  hasClient(instanceId: string): boolean {
    return this.clients.has(instanceId)
  }

  /**
   * Remove a client and its configuration
   */
  removeClient(instanceId: string): boolean {
    const clientRemoved = this.clients.delete(instanceId)
    this.wikidataClients.delete(instanceId) // Clean up Wikidata client too
    const instanceRemoved = this.instances.delete(instanceId)
    return clientRemoved && instanceRemoved
  }

  /**
   * Get all registered instance IDs
   */
  getInstanceIds(): string[] {
    return Array.from(this.instances.keys())
  }

  /**
   * Get all registered instances
   */
  getAllInstances(): NodemwWikibaseInstanceConfig[] {
    return Array.from(this.instances.values())
  }

  /**
   * Get default nodemw configuration from instance config
   */
  private getDefaultNodemwConfig(instanceConfig: WikibaseInstanceConfig): any {
    const url = new URL(instanceConfig.baseUrl)

    return {
      protocol: url.protocol.replace(':', ''),
      server: url.hostname,
      path: url.pathname.endsWith('/') ? `${url.pathname}w` : `${url.pathname}/w`,
      userAgent: instanceConfig.userAgent,
      concurrency: 3, // Default concurrency
      debug: false,
    }
  }
}

// Export a singleton instance
export const nodemwWikibaseService = new NodemwWikibaseService()
