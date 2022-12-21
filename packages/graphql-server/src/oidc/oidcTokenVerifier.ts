import * as jose from 'jose';
import { Issuer } from 'openid-client';
import Token from './token';
import Boom from 'boom';
import { ErrorCodes } from '../errorCodes';

export class OidcTokenVerifier {
  private jwks: any;

  constructor({
    jwks
  }: {
    jwks: any
  }) {
    this.jwks = jwks;
  }

  public verify = async (accessToken: string): Promise<any> => {
    const token = new Token(accessToken);
    if (token.isExpired()) {
      throw Boom.forbidden('token expired', {code: ErrorCodes.ACCESS_TOKEN_EXPIRED});
    }

    //const JWKS = jose.createRemoteJWKSet(new URL(this.issuer.metadata.jwks_uri))
    const {payload} = await jose.jwtVerify(accessToken, this.jwks);
    return payload;
  }
}
