import jose from 'node-jose';
import { Issuer } from 'openid-client';
import Token from './token';
import Boom from 'boom';
import { ErrorCodes } from '../errorCodes';

export class OidcTokenVerifier {
  private keystore: any;
  private issuer: Issuer;

  constructor({
    issuer
  }: {
    issuer: Issuer
  }) {
    this.issuer = issuer;
  }

  public initKeystore = async () => {
    this.keystore = await this.issuer.keystore();
  }

  public verify = async (accessToken: string): Promise<any> => {
    if (!this.keystore) {
      throw new Error(`Call initKeystore() first to initialize the keystore`);
    }

    const token = new Token(accessToken);
    if (token.isExpired()) {
      throw Boom.forbidden('token expired', {code: ErrorCodes.ACCESS_TOKEN_EXPIRED});
    }

    const keystore = this.keystore;
    const result = await jose.JWS.createVerify(keystore).verify(accessToken);
    return JSON.parse(result.payload.toString());
  }
}
