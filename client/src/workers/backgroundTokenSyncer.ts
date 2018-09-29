/**
 * BackgroundTokenSyncer
 * two step implementation
 * First:
 *  Get refresh_token expirationTime from window and check its expiration
 *  if expired, redirect to keycloak loginUrl immediately
 * 
 * Second:
 *  sync with backend to exchange the new refresh_token
 */

const ONE_MINUTE = 60;

export class BackgroundTokenSyncer {
  private interval: number;
  private refreshTokenExp: number;
  // if token is going to expired in 1 minute, call this method
  private refreshWarningCallback: () => void;
  private refreshWarningCalled: boolean = false;

  constructor({
    interval,
    refreshTokenExp,
    refreshWarningCallback = () => {}
  }: {
    interval?: number,
    refreshTokenExp: number,
    refreshWarningCallback: () => void
  }) {
    this.interval = interval || 1000;

    if (!refreshTokenExp) {
      console.warn("no refresh token exp");
    } else if (typeof refreshTokenExp !== 'number') {
      console.warn(`invalid refreshTokenExp. Got ${refreshTokenExp}`);
    }

    this.refreshTokenExp = refreshTokenExp;
    this.refreshWarningCallback = refreshWarningCallback;
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
    const timeDiff = this.refreshTokenExp - nowInSecond;
    if (timeDiff <= ONE_MINUTE && !this.refreshWarningCalled) {
      this.refreshWarningCallback();
      this.refreshWarningCalled = true;
    }

    // schedule next
    setTimeout(() => {
      this.run().catch(console.error);
    }, this.interval);
  }
}
