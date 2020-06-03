import LRUCache from 'lru-cache';

const INVALID_API_TOKEN: string = 'INVALID_API_TOKEN';

export default class ApiTokenCache {
  private oidcClient: any;
  private cache: LRUCache<string, string>;

  constructor({
    oidcClient
  }: {
    oidcClient: any,
  }) {
    this.oidcClient = oidcClient;
    this.cache = new LRUCache({ max: 1024 });
  }

  public getAccessToken = async (apiToken: string) => {
    let accessToken = this.cache.get(apiToken);
    if (accessToken == null) {
      try {
        accessToken = await this.getAccessTokenByApiToken(apiToken);
        this.cache.set(apiToken, accessToken, 1000 * 30);
      } catch (err) {
        accessToken = INVALID_API_TOKEN;
        this.cache.set(apiToken, accessToken, 1000 * 5);
      }
    }

    if (accessToken === INVALID_API_TOKEN) {
      throw new Error('Invalid API Token');
    }

    return accessToken;
  }

  private getAccessTokenByApiToken = async (apiToken: string) => {
    const tokenSet = await this.oidcClient.refresh(apiToken);
    return tokenSet.access_token;
  }
}
