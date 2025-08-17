import nodemw from 'nodemw'
import type {
  WikibaseInstanceConfig,
  NodemwWikibaseInstanceConfig,
  PropertyDetails,
  PropertySearchResult,
  ItemDetails,
  ItemSearchResult,
  SearchOptions,
  SearchResponse,
} from '@backend/types/wikibase-api'
import type { PropertyId, ItemId } from 'wikibase-sdk'

/**
 * Wikibase API Service using nodemw for comprehensive MediaWiki API coverage
 */
export class NodemwWikibaseService {
  private clients: Map<string, any> = new Map()
  private wikidataClients: Map<string, any> = new Map()
  private instances: Map<string, NodemwWikibaseInstanceConfig> = new Map()

  /**
   * Create a new nodemw client for the given instance configuration
   */
  createClient(instanceConfig: NodemwWikibaseInstanceConfig): any {
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
  getClient(instanceId: string): any {
    const client = this.clients.get(instanceId)
    if (!client) {
      throw new Error(`No client found for instance: ${instanceId}`)
    }
    return client
  }

  /**
   * Get or create a Wikidata client for constraint validation
   */
  getWikidataClient(instanceId: string): any {
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
   * Search for properties in the specified Wikibase instance
   */
  async searchProperties(
    instanceId: string,
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResponse<PropertySearchResult>> {
    const client = this.getClient(instanceId)
    const limit = options.limit ?? 10
    const language = options.language ?? 'en'

    // Use Wikibase search entities API for better property search
    const searchParams = {
      action: 'wbsearchentities',
      search: query,
      type: 'property',
      language,
      limit,
      continue: options.offset ?? 0,
      format: 'json',
    }

    return new Promise((resolve, reject) => {
      ;(client as any).api.call(searchParams, (err: any, data: any) => {
        if (err) {
          reject(err)
          return
        }

        const results: PropertySearchResult[] =
          data.search?.map((item: any) => ({
            id: item.id,
            label: item.label || item.id,
            description: item.description || '',
            dataType: item.datatype || 'unknown',
            match: {
              type: item.match?.type || ('label' as const),
              language: item.match?.language || language,
              text: item.match?.text || item.label || item.id,
            },
          })) ?? []

        resolve({
          results,
          totalCount: data['search-info']?.search || results.length,
          hasMore: data['search-continue'] !== undefined,
          query,
        })
      })
    })
  }

  /**
   * Get property details by ID
   */
  async getProperty(instanceId: string, propertyId: PropertyId): Promise<PropertyDetails> {
    const client = this.getClient(instanceId)

    return new Promise((resolve, reject) => {
      const params = {
        action: 'wbgetentities',
        ids: propertyId,
        props: 'labels|descriptions|aliases|datatype|claims',
        languagefallback: true,
        format: 'json',
      }

      ;(client as any).api.call(params, (err: any, data: any) => {
        if (err) {
          reject(err)
          return
        }

        const entity = data.entities?.[propertyId]
        if (!entity) {
          reject(new Error(`Property ${propertyId} not found`))
          return
        }

        if (entity.missing !== undefined) {
          reject(new Error(`Property ${propertyId} not found`))
          return
        }

        const labels = entity.labels ?? {}
        const descriptions = entity.descriptions ?? {}
        const aliases = entity.aliases ?? {}
        const claims = entity.claims ?? {}

        const propertyDetails: PropertyDetails = {
          id: propertyId,
          dataType: entity.datatype ?? 'unknown',
          labels: Object.fromEntries(
            Object.entries(labels).map(([lang, data]: [string, any]) => [lang, data.value]),
          ),
          descriptions: Object.fromEntries(
            Object.entries(descriptions).map(([lang, data]: [string, any]) => [lang, data.value]),
          ),
          aliases: Object.fromEntries(
            Object.entries(aliases).map(([lang, aliasArray]: [string, any]) => [
              lang,
              aliasArray.map((alias: any) => alias.value),
            ]),
          ),
          statements: Object.entries(claims).flatMap(([propertyId, claimArray]: [string, any]) =>
            claimArray.map((claim: any) => ({
              id: claim.id ?? `${propertyId}-${Math.random().toString(36).substring(2, 9)}`,
              property: propertyId,
              value: {
                type: claim.mainsnak?.datatype ?? 'unknown',
                content: claim.mainsnak?.datavalue?.value ?? null,
              },
              rank: (claim.rank ?? 'normal') as 'preferred' | 'normal' | 'deprecated',
            })),
          ),
        }

        resolve(propertyDetails)
      })
    })
  }

  /**
   * Search for items in the specified Wikibase instance
   */
  async searchItems(
    instanceId: string,
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResponse<ItemSearchResult>> {
    const client = this.getClient(instanceId)
    const limit = options.limit ?? 10
    const language = options.language ?? 'en'

    return new Promise((resolve, reject) => {
      const searchParams = {
        action: 'wbsearchentities',
        search: query,
        type: 'item',
        language,
        limit,
        continue: options.offset ?? 0,
        format: 'json',
      }

      ;(client as any).api.call(searchParams, (err: any, data: any) => {
        if (err) {
          reject(err)
          return
        }

        const searchResults = data.search ?? []
        const results: ItemSearchResult[] = searchResults.map((item: any) => ({
          id: item.id,
          label: item.label ?? item.id,
          description: item.description,
          match: {
            type: (item.match?.type ?? 'label') as 'label' | 'alias' | 'description',
            text: item.match?.text ?? item.label ?? item.id,
          },
        }))

        resolve({
          results,
          totalCount: data['search-continue'] ? limit + (options.offset ?? 0) + 1 : results.length,
          hasMore: !!data['search-continue'],
          query,
        })
      })
    })
  }

  /**
   * Get item details by ID
   */
  async getItem(instanceId: string, itemId: ItemId): Promise<ItemDetails> {
    const client = this.getClient(instanceId)

    return new Promise((resolve, reject) => {
      const params = {
        action: 'wbgetentities',
        ids: itemId,
        props: 'labels|descriptions|aliases|claims|sitelinks',
        languagefallback: true,
        format: 'json',
      }

      ;(client as any).api.call(params, (err: any, data: any) => {
        if (err) {
          reject(err)
          return
        }

        const entity = data.entities?.[itemId]
        if (!entity) {
          reject(new Error(`Item ${itemId} not found`))
          return
        }

        if (entity.missing !== undefined) {
          reject(new Error(`Item ${itemId} not found`))
          return
        }

        const labels = entity.labels ?? {}
        const descriptions = entity.descriptions ?? {}
        const aliases = entity.aliases ?? {}
        const claims = entity.claims ?? {}
        const sitelinks = entity.sitelinks ?? {}

        const itemDetails: ItemDetails = {
          id: itemId,
          labels: Object.fromEntries(
            Object.entries(labels).map(([lang, data]: [string, any]) => [lang, data.value]),
          ),
          descriptions: Object.fromEntries(
            Object.entries(descriptions).map(([lang, data]: [string, any]) => [lang, data.value]),
          ),
          aliases: Object.fromEntries(
            Object.entries(aliases).map(([lang, aliasArray]: [string, any]) => [
              lang,
              aliasArray.map((alias: any) => alias.value),
            ]),
          ),
          statements: Object.entries(claims).flatMap(([propertyId, claimArray]: [string, any]) =>
            claimArray.map((claim: any) => ({
              id: claim.id ?? `${propertyId}-${Math.random().toString(36).substring(2, 9)}`,
              property: propertyId,
              value: {
                type: claim.mainsnak?.datatype ?? 'unknown',
                content: claim.mainsnak?.datavalue?.value ?? null,
              },
              rank: (claim.rank ?? 'normal') as 'preferred' | 'normal' | 'deprecated',
            })),
          ),
          sitelinks,
        }

        resolve(itemDetails)
      })
    })
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
      concurrency: 3,
      debug: false,
    }
  }
}

// Export a singleton instance
export const nodemwWikibaseService = new NodemwWikibaseService()
