import type { ApiResponse, LoginResponse, MediaWikiConfig } from '@backend/types/mediawiki-api'

export class MediaWikiApiService {
  private config: MediaWikiConfig
  private tokens = new Map<string, string>()

  constructor(config: MediaWikiConfig) {
    this.config = config
  }

  private async request<T>(params: Record<string, any>, method = 'GET'): Promise<ApiResponse<T>> {
    const url = new URL(this.config.endpoint)
    const body = new URLSearchParams({ format: 'json', ...params })

    const options: RequestInit = {
      method,
      headers: {
        'User-Agent': this.config.userAgent,
      },
    }

    if (method === 'POST') {
      options.body = body.toString()
    } else {
      url.search = body.toString()
    }

    const response = await fetch(url.toString(), options)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json() as Promise<ApiResponse<T>>
  }

  async getToken(type = 'csrf'): Promise<string> {
    if (this.tokens.has(type)) {
      return this.tokens.get(type)!
    }

    const response = await this.request<any>({ action: 'query', meta: 'tokens', type })
    const token = response.query?.tokens?.[`${type}token`]

    if (token) {
      this.tokens.set(type, token)
    }

    return token || ''
  }

  async authenticate(username: string, password: string): Promise<LoginResponse> {
    const loginToken = await this.getToken('login')
    return this.request(
      {
        action: 'login',
        lgname: username,
        lgpassword: password,
        lgtoken: loginToken,
      },
      'POST',
    )
  }

  async get<T = any>(params: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>(params, 'GET')
  }

  async post<T = any>(params: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>(params, 'POST')
  }

  clearTokens(): void {
    this.tokens.clear()
  }
}

export default MediaWikiApiService
