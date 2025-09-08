import { MediaWikiApiService } from '@backend/services/mediawiki-api.service'
import { mediaWikiConfigService } from '@backend/services/mediawiki-config.service'
import type {
  MediaWikiInstanceConfig,
  WikibaseGetEntitiesResponse,
  WikibaseSearchEntityResponse,
  WikibaseSearchEntityResult,
} from '@backend/types/mediawiki-api'
import type {
  ItemDetails,
  ItemSearchResult,
  PropertyDetails,
  PropertySearchResult,
  SearchOptions,
  SearchResponse,
  WikibaseInstanceConfig,
} from '@backend/types/wikibase-api'
import type { ItemId, PropertyId } from '@backend/types/wikibase-schema'

/**
 * Wikibase API Service using MediaWiki API for comprehensive Wikibase coverage
 */
export class WikibaseService {
  private wikidataClient: MediaWikiApiService = new MediaWikiApiService(
    mediaWikiConfigService.getInstance('wikidata'),
  )
  private clients: Map<string, MediaWikiApiService> = new Map()
  private instances: Map<string, WikibaseInstanceConfig> = new Map()

  /**
   * Create a new client for a Wikibase instance
   */
  createClient(instanceConfig: WikibaseInstanceConfig): MediaWikiApiService {
    const mediaWikiConfig: MediaWikiInstanceConfig = {
      id: instanceConfig.id,
      name: instanceConfig.name,
      endpoint: this.getApiEndpoint(instanceConfig.baseUrl),
      userAgent: instanceConfig.userAgent,
      timeout: 30000,
      token: instanceConfig.authToken,
    }

    const client = new MediaWikiApiService(mediaWikiConfig)

    this.clients.set(instanceConfig.id, client)
    this.instances.set(instanceConfig.id, instanceConfig)

    return client
  }

  /**
   * Get an existing client for the given instance ID
   */
  getClient(instanceId: string): MediaWikiApiService {
    if (instanceId === 'wikidata') return this.wikidataClient

    const client = this.clients.get(instanceId)
    if (!client) {
      throw new Error(`No client found for instance: ${instanceId}`)
    }
    return client
  }

  /**
   * Get instance configuration
   */
  getInstance(instanceId: string): WikibaseInstanceConfig {
    const instance = this.instances.get(instanceId)
    if (!instance) {
      throw new Error(`No instance configuration found for: ${instanceId}`)
    }
    return instance
  }

  /**
   * Check if a client exists for the given instance
   */
  hasClient(instanceId: string): boolean {
    return instanceId === 'wikidata' || this.clients.has(instanceId)
  }

  /**
   * Remove a client and its configuration
   */
  removeClient(instanceId: string): boolean {
    const clientRemoved = this.clients.delete(instanceId)
    const instanceRemoved = this.instances.delete(instanceId)
    return clientRemoved && instanceRemoved
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
    const autocomplete = options.autocomplete ?? true

    const searchParams: Record<string, string | number | boolean> = {
      action: 'wbsearchentities',
      search: query,
      type: 'property',
      language,
      limit,
      continue: options.offset ?? 0,
      format: 'json',
      formatVersion: 2,
    }

    if (autocomplete) {
      searchParams.strictlanguage = false
    }

    const response = (await client.get(searchParams)) as WikibaseSearchEntityResponse

    if (response.error) {
      throw new Error(`Search failed: ${response.error.info}`)
    }

    const mapSearchResult = (item: WikibaseSearchEntityResult): PropertySearchResult => ({
      id: item.id as PropertyId,
      label: item.label || item.id,
      description: item.description || '',
      datatype: item.datatype || 'unknown',
      match: {
        type:
          item.match?.type === 'alias' || item.match?.type === 'description'
            ? item.match.type
            : 'label',
        text: item.match?.text || item.label || item.id,
      },
    })

    let results: PropertySearchResult[] = response.search?.map(mapSearchResult) ?? []

    if (options.datatype) {
      results = results.filter((result) => result.datatype === options.datatype)
    }

    return {
      results,
      totalCount: response['search-info']?.search || results.length,
      hasMore: response['search-continue'] !== undefined,
      query,
    }
  }

  /**
   * Get property details by ID
   */
  async getProperty(instanceId: string, propertyId: PropertyId): Promise<PropertyDetails | null> {
    const client = this.getClient(instanceId)

    const params = {
      action: 'wbgetentities',
      ids: propertyId,
      languagefallback: true,
      format: 'json',
    }

    const response = (await client.get(params)) as WikibaseGetEntitiesResponse

    if (response.error) {
      throw new Error(`Failed to get property: ${response.error.info}`)
    }

    const entity = response.entities?.[propertyId]
    if (!entity || entity.missing !== undefined) {
      return null
    }

    const labels = entity.labels ?? {}
    const descriptions = entity.descriptions ?? {}
    const aliases = entity.aliases ?? {}

    const propertyDetails: PropertyDetails = {
      id: propertyId,
      type: 'property',
      datatype: entity.datatype ?? 'unknown',
      labels: Object.fromEntries(
        Object.entries(labels).map(([lang, data]) => [lang, (data as { value: string }).value]),
      ),
      descriptions: Object.fromEntries(
        Object.entries(descriptions).map(([lang, data]) => [
          lang,
          (data as { value: string }).value,
        ]),
      ),
      aliases: Object.fromEntries(
        Object.entries(aliases).map(([lang, aliasArray]) => [
          lang,
          (aliasArray as { value: string }[]).map((alias) => alias.value),
        ]),
      ),
      claims: (entity.claims as Record<string, any[]>) || {},
    }

    return propertyDetails
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
    const autocomplete = options.autocomplete ?? true

    const searchParams: Record<string, string | number | boolean> = {
      action: 'wbsearchentities',
      search: query,
      type: 'item',
      language,
      limit,
      continue: options.offset ?? 0,
      format: 'json',
      formatVersion: 2,
    }

    if (autocomplete) {
      searchParams.strictlanguage = false
    }

    const response = (await client.get(searchParams)) as WikibaseSearchEntityResponse

    if (response.error) {
      throw new Error(`Search failed: ${response.error.info}`)
    }

    const mapSearchResult = (item: WikibaseSearchEntityResult): ItemSearchResult => ({
      id: item.id,
      label: item.label || item.id,
      description: item.description || '',
      match: {
        type:
          item.match?.type === 'alias' || item.match?.type === 'description'
            ? item.match.type
            : 'label',
        text: item.match?.text || item.label || item.id,
      },
    })

    const results: ItemSearchResult[] = response.search?.map(mapSearchResult) ?? []

    return {
      results,
      totalCount: response['search-info']?.search || results.length,
      hasMore: response['search-continue'] !== undefined,
      query,
    }
  }

  /**
   * Get item details by ID
   */
  async getItem(instanceId: string, itemId: ItemId): Promise<ItemDetails | null> {
    const client = this.getClient(instanceId)

    const params = {
      action: 'wbgetentities',
      ids: itemId,
      languagefallback: true,
      format: 'json',
    }

    const response = (await client.get(params)) as WikibaseGetEntitiesResponse

    if (response.error) {
      throw new Error(`Failed to get item: ${response.error.info}`)
    }

    const entity = response.entities?.[itemId]
    if (!entity || entity.missing !== undefined) {
      return null
    }

    const itemDetails: ItemDetails = {
      id: itemId,
      type: 'item',
      labels: entity.labels
        ? Object.fromEntries(
            Object.entries(entity.labels).map(([lang, label]) => [lang, label.value]),
          )
        : {},
      descriptions: entity.descriptions
        ? Object.fromEntries(
            Object.entries(entity.descriptions).map(([lang, desc]) => [lang, desc.value]),
          )
        : {},
      aliases: entity.aliases
        ? Object.fromEntries(
            Object.entries(entity.aliases).map(([lang, aliases]) => [
              lang,
              aliases.map((alias) => alias.value),
            ]),
          )
        : {},
      claims: entity.claims ? this.convertEntityClaimsToClaims(entity.claims) : {},
    }

    return itemDetails
  }

  /**
   * Convert WikibaseEntityClaim[] to Claim[]
   */
  private convertEntityClaimsToClaims(entityClaims: Record<string, any[]>): Record<string, any[]> {
    const claims: Record<string, any[]> = {}

    for (const [propertyId, claimArray] of Object.entries(entityClaims)) {
      claims[propertyId] = claimArray.map((claim) => ({
        ...claim,
        type: 'statement',
        property: propertyId,
        datatype: claim.mainsnak?.datatype || 'unknown',
        hash: claim.id || '',
        qualifiers: claim.qualifiers || {},
        references: claim.references || [],
      }))
    }

    return claims
  }

  /**
   * Get API endpoint from base URL
   */
  private getApiEndpoint(baseUrl: string): string {
    const url = new URL(baseUrl)
    const path = url.pathname.endsWith('/')
      ? `${url.pathname}w/api.php`
      : `${url.pathname}/w/api.php`
    return `${url.protocol}//${url.host}${path}`
  }
}

// Export a singleton instance
export const wikibaseService = new WikibaseService()
