// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import faker from 'faker';
import KeycloakAdminClient from 'keycloak-admin';
import BPromise from 'bluebird';
import { times } from 'lodash';

chai.use(chaiHttp);

const expect = chai.expect;

// utils
const userFields = `
  id
  username
  email
  firstName
  lastName
  totp
  #isAdmin
  enabled
  createdTimestamp
  #personalDiskQuota
  groups {
    id
    name
    displayName
    quotaCpu
    quotaGpu
    quotaDisk
  }`;

// interface

declare module 'mocha' {
  // tslint:disable-next-line:interface-name
  interface ISuiteCallbackContext {
    graphqlRequest?: (query: string, variables?: any) => Promise<any>;
    kcAdminClient?: KeycloakAdminClient;
    users?: any;
  }
}

describe('Many users graphql', function() {
  this.timeout(200000);
  before(async () => {
    this.graphqlRequest = (global as any).graphqlRequest;
    this.kcAdminClient = (global as any).kcAdminClient;
    await (global as any).authKcAdmin();
  });

  it('should add 200 users', async () => {
    const usersData = times(200, index => {
      return {
        username: faker.internet.userName().toLowerCase(),
        firstName: `${index}${faker.name.firstName()}`,
        email: faker.internet.email().toLowerCase()
      };
    });
    await Promise.all(usersData.map(user => {
      return this.graphqlRequest(`
      mutation($data: UserCreateInput!){
        createUser (data: $data) { id username email firstName }
      }`, {
        data: user
      });
    }));
  });

  it('should expect users when query users', async () => {
    const data = await this.graphqlRequest(`{
      users {${userFields}}
    }`);
    this.users = data.users;
  });

  it('should expect users when query users pagination', async () => {
    const data = await this.graphqlRequest(`{
      usersConnection(first: 100, after: "${this.users[98].id}") {
        edges {
          node {
            ${userFields}
          }
        }
      }
    }`);
    expect(data.usersConnection.edges.length).to.be.eql(100);
    expect(data.usersConnection.edges[0].node).to.deep.include(this.users[99]);
  });
});
