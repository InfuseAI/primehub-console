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

    const {payload} = await jose.jwtVerify(accessToken, this.jwks);
    return payload;
  }
}
