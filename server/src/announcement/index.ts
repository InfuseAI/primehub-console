import { Context } from 'koa';
import KeycloakAdminClient from 'keycloak-admin';
import Boom from 'boom';
import { isEmpty, isNumber } from 'lodash';
import { Attributes, FieldType } from '../resolvers/attr';
import { parseDiskQuota, stringifyDiskQuota } from '../resolvers/utils';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';

export class AnnCtrl {
  private createKcAdminClient: () => KeycloakAdminClient;
  private sharedGraphqlSecretKey: string;
  private getAccessToken: () => Promise<string>;

  constructor({
    createKcAdminClient,
    sharedGraphqlSecretKey,
    getAccessToken
  }: {
    createKcAdminClient: () => KeycloakAdminClient,
    sharedGraphqlSecretKey: string,
    getAccessToken: () => Promise<string>
  }) {
    this.createKcAdminClient = createKcAdminClient;
    this.sharedGraphqlSecretKey = sharedGraphqlSecretKey;
    this.getAccessToken = getAccessToken;
  }

  public updateUserLastReadTime = async (ctx: Context) => {
    if (!this.sharedGraphqlSecretKey) {
      throw Boom.forbidden('required to set up sharedGraphqlSecretKey to proceed');
    }
    const kcAdminClient = this.createKcAdminClient();
    const {userId} = ctx.params;
    const {time} = ctx.request.body as any;
    const {authorization = ''}: {authorization: string} = ctx.header;

    if (!userId) {
      throw Boom.badData('require userId in body');
    }

    if (!time || !isNumber(time) || time.toString().length !== 10) {
      throw Boom.badData('time not valid');
    }

    // if sharedGraphqlSecretKey is set and token is brought in bearer
    // no matter what grant type is chosen, Bearer type always has higest priority
    if (authorization.indexOf('Bearer') < 0) {
      throw Boom.forbidden('no token in header');
    }

    const apiToken = authorization.replace('Bearer ', '');

    // sharedGraphqlSecretKey should not be empty
    if (isEmpty(this.sharedGraphqlSecretKey)
        || this.sharedGraphqlSecretKey !== apiToken) {
      throw Boom.forbidden('apiToken not valid');
    }

    const accessToken = await this.getAccessToken();
    kcAdminClient.setAccessToken(accessToken);

    // update user attribute annLastReadTime
    const user = await kcAdminClient.users.findOne({
      id: userId
    });

    // merge attrs
    const attrs = new Attributes({
      keycloakAttr: user.attributes,
      schema: {
        volumeCapacity: {serialize: stringifyDiskQuota, deserialize: parseDiskQuota},
        annLastReadTime: {type: FieldType.integer}
      }
    });
    attrs.mergeWithData({
      annLastReadTime: time
    });

    await kcAdminClient.users.update({id: userId}, {
      attributes: attrs.toKeycloakAttrs()
    });

    ctx.status = 200;
  }
}

export const mount = (rootRouter: Router, annCtrl: AnnCtrl) => {
  rootRouter.post('/users/:userId/last-read-time', bodyParser(), annCtrl.updateUserLastReadTime);
};
