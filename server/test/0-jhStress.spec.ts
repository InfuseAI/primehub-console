// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import faker from 'faker';
import KeycloakAdminClient from 'keycloak-admin';
import { range } from 'lodash';
import { cleaupAllCrd } from './sandbox';

chai.use(chaiHttp);

const expect = chai.expect;

const jhQuery = (id: string) => `
query {
  user (where: { id: "${id}" }) {
    id
    username
    groups {
      name
      displayName
      quotaCpu
      quotaGpu
      quotaMemory
      projectQuotaCpu
      projectQuotaGpu
      projectQuotaMemory
      instanceTypes { name displayName description spec global }
      images { name displayName description spec global }
      datasets { name displayName description spec }
    }
  }
}
`;

declare module 'mocha' {
  // tslint:disable-next-line:interface-name
  interface ISuiteCallbackContext {
    graphqlRequestWithAuth?: (query: string, variables?: any, auth?: any) => Promise<any>;
    kcAdminClient?: KeycloakAdminClient;
    currentUserId?: string;
    secret?: string;
  }
}

describe('jupyterHub stress test', function() {
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

    // create groups and crd
    const createGroupWithCrd = async (userId: string) => {
      const create = await this.graphqlRequestWithAuth(`
      mutation($data: GroupCreateInput!){
        createGroup (data: $data) { id }
      }`, {
        data: {
          name: faker.internet.userName().toLowerCase(),
          users: {
            connect: [{id: userId}]
          }
        }
      });
      const groupId = create.createGroup.id;

      await this.graphqlRequestWithAuth(`
        mutation($data: ImageCreateInput!){
          createImage (data: $data) { id name groups {id name} }
        }`, {
          data: {
            name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
            groups: {
              connect: [{id: groupId}]
            }
          }
        });

      await this.graphqlRequestWithAuth(`
        mutation($data: DatasetCreateInput!){
          createDataset (data: $data) { id name groups {id name} }
        }`, {
          data: {
            name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
            groups: {
              connect: [{id: groupId}]
            }
          }
        });

      await this.graphqlRequestWithAuth(`
        mutation($data: InstanceTypeCreateInput!){
          createInstanceType (data: $data) { id name groups {id name} }
        }`, {
          data: {
            name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
            groups: {
              connect: [{id: groupId}]
            }
          }
        });
      };
    await Promise.all(range(10).map(async () => {
      await createGroupWithCrd(this.currentUserId);
    }));
  });

  after(async () => {
    await cleaupAllCrd();
  });

  it('should query with shared-token', async () => {
    const query = jhQuery(this.currentUserId);

    // make it busy
    Promise.all(range(200).map(async i => {
      await (global as any).authKcAdmin();
      await this.kcAdminClient.users.find({
        realm: process.env.KC_REALM
      });
    }));

    await Promise.all(range(100).map(async index => {
      const data = await this.graphqlRequestWithAuth(query, null, `Bearer ${this.secret}`);
      expect(data.user.id).to.be.equal(this.currentUserId);
    }));
  });
});
