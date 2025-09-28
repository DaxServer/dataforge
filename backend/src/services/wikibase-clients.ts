import { type CSRFTokenResponse, InstanceId, OAuthCredentials } from '@backend/api/wikibase/schemas'
import { MediaWikiApiService } from '@backend/services/mediawiki-api.service'
import OAuth from 'oauth'

export class WikibaseClient {
  private readonly endpoints: Record<InstanceId, string> = {
    wikidata: 'https://www.wikidata.org/w/api.php',
    commons: 'https://commons.wikimedia.org/w/api.php',
  }

  private clients: Record<InstanceId, MediaWikiApiService> = {
    wikidata: new MediaWikiApiService({
      endpoint: this.endpoints.wikidata,
      userAgent: 'DataForge/1.0 (https://github.com/DaxServer/dataforge)',
      timeout: 30000,
    }),
    commons: new MediaWikiApiService({
      endpoint: this.endpoints.commons,
      userAgent: 'DataForge/1.0 (https://github.com/DaxServer/dataforge)',
      timeout: 30000,
    }),
  }

  private credentials: Partial<Record<InstanceId, OAuthCredentials>> = {}
  private authenticatedClients: Partial<Record<InstanceId, OAuth.OAuth>> = {}

  getClient(instanceId: InstanceId): MediaWikiApiService {
    const client = this.clients[instanceId]
    if (!client) {
      throw new Error(`No client found for instance: ${instanceId}`)
    }
    return client
  }

  getAuthenticatedClient(instanceId: InstanceId, credentials: OAuthCredentials): OAuth.OAuth {
    if (!(instanceId in this.authenticatedClients)) {
      const client = this.getClient(instanceId)
      this.credentials[instanceId] = credentials
      this.authenticatedClients[instanceId] = new OAuth.OAuth(
        this.endpoints[instanceId],
        this.endpoints[instanceId],
        credentials.consumerKey,
        credentials.consumerSecret,
        '1.0',
        null,
        'HMAC-SHA1',
        undefined,
        {
          'User-Agent': client.config.userAgent,
        },
      )
    }
    return this.authenticatedClients[instanceId] as OAuth.OAuth
  }

  async getCsrfToken(
    instanceId: InstanceId,
    credentials: OAuthCredentials,
  ): Promise<CSRFTokenResponse> {
    const authService = this.getAuthenticatedClient(instanceId, credentials)

    return new Promise((resolve, reject) => {
      authService.get(
        this.endpoints[instanceId] +
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
