/**
 * BackgroundTokenSyncer
 *  sync with backend to exchange the new refresh_token
 */

const ONE_MINUTE = 60;

export class BackgroundTokenSyncer {
  private interval: number;
  private refreshTokenExp: number;
  private getNewRefreshToken: () => Promise<{
    redirectUrl?: string;
    exp?: number;
  }>;
  // if we can't extend expiration time, notify user
  private reLoginNotify: ({loginUrl}: {loginUrl: string}) => void;
  private reloginNotifyCalled: boolean = false;
  private appPrefix: string;

  constructor({
    interval,
    refreshTokenExp,
    getNewRefreshToken,
    reLoginNotify = () => {},
    appPrefix
  }: {
    interval?: number,
    refreshTokenExp: number,
    getNewRefreshToken: () => Promise<{
      redirectUrl?: string;
      exp?: number;
    }>,
    reLoginNotify: ({loginUrl}: {loginUrl: string}) => void,
    appPrefix?: string
  }) {
    this.interval = interval || 1000;

    if (!refreshTokenExp) {
      console.warn("no refresh token exp");
    } else if (typeof refreshTokenExp !== 'number') {
      console.warn(`invalid refreshTokenExp. Got ${refreshTokenExp}`);
    }

    this.getNewRefreshToken = getNewRefreshToken;
    this.refreshTokenExp = refreshTokenExp;
    this.reLoginNotify = reLoginNotify;
    this.appPrefix = appPrefix || '/';
  }

  public run = async () => {
    if (!this.refreshTokenExp || typeof this.refreshTokenExp !== 'number') {
      console.warn("refreshToken not valid to run");
      return;
    }

    const nowInSecond = Math.floor(new Date().getTime() / 1000);

    // if expired
    if (nowInSecond >= this.refreshTokenExp) {
      // refresh
      window.location.reload();
    }

    // not expired, but check if close
    // if close => exchange new refresh token
    const timeDiff = this.refreshTokenExp - nowInSecond;
    if (timeDiff <= ONE_MINUTE && !this.reloginNotifyCalled) {
      try {
        const newTokenResponse = await this.getNewRefreshToken();
        if (!newTokenResponse.exp) {
          // if expire not set, log user out
          window.location.replace(`${this.appPrefix}oidc/logout`);
          return;
        }
  
        // successfully set token, check and update the refresh token
        // if expired time doesn't get extend, notify user with re-login button
        if (this.refreshTokenExp >= newTokenResponse.exp) {
          this.reLoginNotify({loginUrl: newTokenResponse.redirectUrl});
          this.reloginNotifyCalled = true;
        } else {
          // successfully get longer exp token
          this.refreshTokenExp = newTokenResponse.exp;
        }
  
        console.log(`use new refresh token with exp: ${this.refreshTokenExp}`);
      } catch (e) {
        console.log('refresh token request failed', e);
      }
    }

    // schedule next
    setTimeout(() => {
      this.run().catch(console.error);
    }, this.interval);
  }
}
