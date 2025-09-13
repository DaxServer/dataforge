import { MediaWikiApiService } from '@backend/services/mediawiki-api.service'
import type { MediaWikiConfig } from '@backend/types/mediawiki-api'

export class WikibaseClient {
  private clients: Record<string, MediaWikiApiService> = {
    wikidata: new MediaWikiApiService({
      endpoint: 'https://www.wikidata.org/w/api.php',
      userAgent: 'DataForge/1.0 (https://github.com/DaxServer/dataforge)',
      timeout: 30000,
    }),
  }

  createClient(id: string, config: MediaWikiConfig): MediaWikiApiService {
    const client = new MediaWikiApiService({
      endpoint: config.endpoint,
      userAgent: config.userAgent,
      timeout: config.timeout,
      token: config.token,
    })

    this.clients[id] = client

    return client
  }

  getClient(instanceId: string): MediaWikiApiService {
    const client = this.clients[instanceId]
    if (!client) {
      throw new Error(`No client found for instance: ${instanceId}`)
    }
    return client
  }

  hasClient(instanceId: string): boolean {
    return this.clients[instanceId] !== undefined
  }

  removeClient(instanceId: string): boolean {
    const clientRemoved = this.clients[instanceId] !== undefined
    delete this.clients[instanceId]
    return clientRemoved
  }
}
