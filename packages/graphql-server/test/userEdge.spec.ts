// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import faker from 'faker';
import KeycloakAdminClient from 'keycloak-admin';
import BPromise from 'bluebird';
import { times, range, random } from 'lodash';

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
  }`;

const usersConnectionField = `
  edges {
    node {
      ${userFields}
    }
    cursor
  }
  pageInfo {
    hasPreviousPage
    hasNextPage
    startCursor
    endCursor
  }
`;
// interface

declare module 'mocha' {
  // tslint:disable-next-line:interface-name
  interface ISuiteCallbackContext {
    graphqlRequest?: (query: string, variables?: any) => Promise<any>;
    kcAdminClient?: KeycloakAdminClient;
    addUsers?: (count: number) => Promise<void>;
    users?: any;
  }
}

describe('Many users graphql', function() {
  before(async () => {
    this.graphqlRequest = (global as any).graphqlRequest;
    this.kcAdminClient = (global as any).kcAdminClient;
    this.addUsers = async (count: number) => {
      const rand = random(1000, 9999);
      // create users with batch
      await BPromise.map(range(count), () => {
        const user = {
          username: `${faker.internet.userName().toLowerCase()}_${rand}`,
          firstName: faker.name.firstName(),
          email: `${rand}_${faker.internet.email().toLowerCase()}`
        };
        return this.graphqlRequest(`
        mutation($data: UserCreateInput!){
          createUser (data: $data) { id username email firstName }
        }`, {
          data: user
        });
      }, {concurrency: 100});
    };
    await (global as any).authKcAdmin();
  });

  describe('pagination on > 20 users', () => {
    before(async () => {
      await this.addUsers(20);
    });

    it('should get first page users', async () => {
      const expectResult = (data: any) => {
        expect(data.edges.length).to.be.equals(10);
        expect(data.pageInfo.hasNextPage).to.be.true;
        expect(data.pageInfo.hasPreviousPage).to.be.false;
        expect(data.pageInfo.startCursor).to.be.null;
        expect(data.pageInfo.endCursor).to.be.equals('1');
      };

      const {usersConnection} = await this.graphqlRequest(`{
        usersConnection(first: 10) {${usersConnectionField}}
      }`);
      expectResult(usersConnection);

      // get by before & last
      const {usersConnection: usersConnectionWithBefore} = await this.graphqlRequest(`{
        usersConnection(last: 10, before: "0") {${usersConnectionField}}
      }`);
      expectResult(usersConnectionWithBefore);
    });

    it('should get 2nd page users', async () => {
      const expectResult = (data: any) => {
        expect(data.edges.length).to.be.equals(10);
        expect(data.pageInfo.hasNextPage).to.be.true;
        expect(data.pageInfo.hasPreviousPage).to.be.true;
        expect(data.pageInfo.startCursor).to.be.equals('0');
        expect(data.pageInfo.endCursor).to.be.equals('2');
      };

      const {usersConnection} = await this.graphqlRequest(`{
        usersConnection(first: 10, after: "1") {${usersConnectionField}}
      }`);
      expectResult(usersConnection);

      // get by before & last
      const {usersConnection: usersConnectionWithBefore} = await this.graphqlRequest(`{
        usersConnection(last: 10, before: "1") {${usersConnectionField}}
      }`);
      expectResult(usersConnectionWithBefore);
    });
  });

  describe.skip('pagination on > 2k users', () => {
    before(async () => {
      this.timeout(10 * 60 * 1000);
      await this.addUsers(2000);
    });

    it('should get first page users', async () => {
      const expectResult = (data: any) => {
        expect(data.edges.length).to.be.equals(10);
        expect(data.pageInfo.hasNextPage).to.be.true;
        expect(data.pageInfo.hasPreviousPage).to.be.false;
        expect(data.pageInfo.startCursor).to.be.null;
        expect(data.pageInfo.endCursor).to.be.equals('1');
      };

      const {usersConnection} = await this.graphqlRequest(`{
        usersConnection(first: 10) {${usersConnectionField}}
      }`);
      expectResult(usersConnection);

      // get by before & last
      const {usersConnection: usersConnectionWithBefore} = await this.graphqlRequest(`{
        usersConnection(last: 10, before: "0") {${usersConnectionField}}
      }`);
      expectResult(usersConnectionWithBefore);
    });

    it('should get 2nd page users', async () => {
      const expectResult = (data: any) => {
        expect(data.edges.length).to.be.equals(10);
        expect(data.pageInfo.hasNextPage).to.be.true;
        expect(data.pageInfo.hasPreviousPage).to.be.true;
        expect(data.pageInfo.startCursor).to.be.equals('0');
        expect(data.pageInfo.endCursor).to.be.equals('2');
      };

      const {usersConnection} = await this.graphqlRequest(`{
        usersConnection(first: 10, after: "1") {${usersConnectionField}}
      }`);
      expectResult(usersConnection);

      // get by before & last
      const {usersConnection: usersConnectionWithBefore} = await this.graphqlRequest(`{
        usersConnection(last: 10, before: "1") {${usersConnectionField}}
      }`);
      expectResult(usersConnectionWithBefore);
    });
  });
});
