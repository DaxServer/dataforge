import { type CSRFTokenResponse, OAuthCredentials } from '@backend/api/wikibase/schemas'
import { MediaWikiApiService } from '@backend/services/mediawiki-api.service'
import type { MediaWikiConfig } from '@backend/types/mediawiki-api'
import OAuth from 'oauth'

export class WikibaseClient {
  private clients: Record<string, MediaWikiApiService> = {
    wikidata: new MediaWikiApiService({
      endpoint: 'https://www.wikidata.org/w/api.php',
      userAgent: 'DataForge/1.0 (https://github.com/DaxServer/dataforge)',
      timeout: 30000,
    }),
    commons: new MediaWikiApiService({
      endpoint: 'https://commons.wikimedia.org/w/api.php',
      userAgent: 'DataForge/1.0 (https://github.com/DaxServer/dataforge)',
      timeout: 30000,
    }),
  }

  private credentials: Record<string, OAuthCredentials> = {}
  private authService: Record<string, OAuth.OAuth> = {}

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

  async getCsrfToken(
    instanceId: string,
    endpoint: string,
    credentials: OAuthCredentials,
  ): Promise<CSRFTokenResponse> {
    const client = this.clients[instanceId]
    if (!client) {
      throw new Error(`Client ${instanceId} not found`)
    }

    this.credentials[instanceId] = credentials
    this.authService[instanceId] = new OAuth.OAuth(
      endpoint,
      endpoint,
      credentials.consumerKey,
      credentials.consumerSecret,
      '1.0',
      null,
      'HMAC-SHA1',
      undefined,
      {
        'User-Agent': 'DataForge/1.0 (https://github.com/DaxServer/dataforge)',
      },
    )

    return new Promise((resolve, reject) => {
      this.authService[instanceId]!.get(
        endpoint +
          '?' +
          new URLSearchParams({
            action: 'query',
            meta: 'tokens',
            format: 'json',
          }).toString(),
        credentials.accessToken,
        credentials.accessTokenSecret,
        (err, data) => {
          if (err) {
            console.error(err)
            reject(err)
            return
          }
          resolve(JSON.parse(data as string) as CSRFTokenResponse)
        },
      )
    })
  }
}
