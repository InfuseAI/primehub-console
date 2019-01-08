import Token from './token';
import * as logger from '../logger';

// constants
const ONE_MINUTE = 60;

export default class TokenSyncer {
  private retryTimes: number = 0;
  private oidcClient: any;
  private clientId: string;
  private accessToken: Token;
  private refreshToken: Token;
  private syncDuration: number = 30000;

  constructor({
    oidcClient,
    clientId
  }: {
    oidcClient: any,
    clientId: string;
  }) {
    this.oidcClient = oidcClient;
    this.clientId = clientId;
  }

  public start = async () => {
    const tokenSet = await this.clientCredentialGrant();
    this.accessToken = new Token(tokenSet.access_token, this.clientId);
    this.refreshToken = new Token(tokenSet.refresh_token, this.clientId);

    // start the sync
    this.scheduleNextSync();
  }

  public getAccessToken = async () => {
    if (this.accessToken.isExpired()) {
      throw new Error(`cannot obtain access token that's expired`);
    }
    return this.accessToken.toString();
  }

  private clientCredentialGrant = async (): Promise<{access_token: string, refresh_token: string}> => {
    const tokenSet = await this.oidcClient.grant({
      grant_type: 'client_credentials'
    });
    return tokenSet;
  }

  private sync = async () => {
    const accessToken = this.accessToken;
    const nowInSecond = Math.floor(new Date().getTime() / 1000);
    const exp = parseInt(accessToken.getContent().exp, 10);
    const timeDiff = exp - nowInSecond;

    // still fresh in safe duration
    if (timeDiff > ONE_MINUTE) {
      // schedule next
      this.scheduleNextSync();
      return;
    }

    // going to expire in safe duration
    // exchange token
    logger.info({
      component: logger.components.tokenSyncer,
      type: 'START_SYNC',
      message: 'token expired in a minute, start exchange'
    });

    // try to get tokenSet from refresh grant or client credential
    const {accessToken: newAccessToken, refreshToken: newRefreshToken} = await this.getTokenSet();
    this.accessToken = newAccessToken;
    this.refreshToken = newRefreshToken;
    this.retryTimes = 0;

    logger.info({
      component: logger.components.tokenSyncer,
      type: 'SUCCESS_EXCHANGE',
      message: `exp extended to ${this.accessToken.getContent().exp}`
    });
    this.scheduleNextSync();
  }

  private scheduleNextSync = () => {
    setTimeout(() => {
      this.sync().catch(err => {
        logger.error({
          component: logger.components.tokenSyncer,
          type: 'ERROR',
          message: err.message,
          stacktrace: err.stacktrace,
        });

        // try 3 times, if it fails, stop trying
        if (this.retryTimes >= 3) {
          logger.error({
            component: logger.components.tokenSyncer,
            type: 'CIRCUIT_BREAK',
            message: 'reach maximum retry times of token exchanging, stop trying',
          });

          // exit hard
          return process.exit(1);
        }

        this.retryTimes += 1;
        this.scheduleNextSync();
      });
    }, this.syncDuration);
  }

  private getTokenSet = async () => {
    let accessToken: Token;
    let refreshToken: Token;
    try {
      const tokenSet = await this.oidcClient.refresh(this.refreshToken.toString());
      accessToken = new Token(tokenSet.access_token, this.clientId);
      refreshToken = new Token(tokenSet.refresh_token, this.clientId);

      // exp in refresh token not extended
      if (this.refreshToken.getContent().exp >= refreshToken.getContent().exp) {
        logger.info({
          component: logger.components.tokenSyncer,
          type: 'EXP_NOT_EXTEND',
          message: 'refreshToken exp not extended, use clientCredential grant to get new one'
        });
        // use client_credentials grant to obtain new refresh token
        const clientCredTokenSet = await this.clientCredentialGrant();
        accessToken = new Token(clientCredTokenSet.access_token, this.clientId);
        refreshToken = new Token(clientCredTokenSet.refresh_token, this.clientId);
      }
    } catch (err) {
      /**
       * Possible errors
       * invalid_grant for expiration
       * invalid_grant (Session not active) => for user deleted
       * invalid_scope (User or client no longer has role permissions for client key: realm-management)
       *  => for remove user from admin
       */
      if (err.error === 'invalid_grant') {
        // get from client credential
        const clientCredTokenSet = await this.clientCredentialGrant();
        accessToken = new Token(clientCredTokenSet.access_token, this.clientId);
        refreshToken = new Token(clientCredTokenSet.refresh_token, this.clientId);
      } else {
        throw err;
      }
    }

    return {accessToken, refreshToken};
  }
}
