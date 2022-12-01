// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import faker from 'faker';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';

chai.use(chaiHttp);

const expect = chai.expect;

declare module 'mocha' {
  // tslint:disable-next-line:interface-name
  interface ISuiteCallbackContext {
    graphqlRequestWithAuth?: (query: string, variables?: any, auth?: any) => Promise<any>;
    kcAdminClient?: KeycloakAdminClient;
    currentUserId?: string;
    secret?: string;
  }
}

describe('readonly graphql', function() {
  before(async () => {
    this.graphqlRequestWithAuth = (global as any).graphqlRequest;
    this.kcAdminClient = (global as any).kcAdminClient;
    await (global as any).authKcAdmin();
    const userData = {
      username: faker.internet.userName().toLowerCase(),
      firstName: faker.name.firstName(),
      email: faker.internet.email().toLowerCase()
    };
    const {createUser} = await this.graphqlRequestWithAuth(`
    mutation($data: UserCreateInput!){
      createUser (data: $data) { id }
    }`, {
      data: userData
    });
    this.currentUserId = createUser.id;
    this.secret = process.env.SHARED_GRAPHQL_SECRET_KEY;
  });

  xit('should query user', async () => {
    const data = await this.graphqlRequestWithAuth(`{
      user (where: {id: "${this.currentUserId}"}) {
        id
        username
        email
        firstName
        lastName
        totp
        isAdmin
        enabled
        createdTimestamp
        volumeCapacity
      }
    }`, null, `Bearer ${this.secret}`);
    expect(data.user.id).to.be.eql(this.currentUserId);
  });

});
