// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import faker from 'faker';
import KeycloakAdminClient from 'keycloak-admin';
import { cleanupDatasets } from './sandbox';

chai.use(chaiHttp);

const expect = chai.expect;

// utils
const fields = `
  id
  name
  displayName
  description
  access
  type
  url
  variables
  groups {
    id
    name
    displayName
    canUseGpu
    cpuQuota
    gpuQuota
    diskQuota
  }`;

declare module 'mocha' {
  // tslint:disable-next-line:interface-name
  interface ISuiteCallbackContext {
    graphqlRequest?: (query: string, variables?: any) => Promise<any>;
    currentDataset?: any;
    kcAdminClient?: KeycloakAdminClient;
  }
}

describe('dataset graphql', function() {
  before(async () => {
    this.graphqlRequest = (global as any).graphqlRequest;
    this.kcAdminClient = (global as any).kcAdminClient;
    await (global as any).authKcAdmin();
  });

  after(async () => {
    await cleanupDatasets();
  });

  it('query datasets', async () => {
    const data = await this.graphqlRequest(`{
      datasets {${fields}}
    }`);
    expect(data.datasets).to.be.eql([]);
  });

  it('create a dataset with only name', async () => {
    const data = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-')
    };
    const mutation = await this.graphqlRequest(`
    mutation($data: DatasetCreateInput!){
      createDataset (data: $data) { ${fields} }
    }`, {
      data
    });

    expect(mutation.createDataset).to.be.eql({
      id: data.name,
      name: data.name,
      displayName: data.name,
      description: null,
      access: null,
      type: null,
      url: null,
      variables: null,
      groups: []
    });

    // get one
    const queryOne = await this.graphqlRequest(`
    query($where: DatasetWhereUniqueInput!){
      dataset (where: $where) { ${fields} }
    }`, {
      where: {id: data.name}
    });

    expect(queryOne.dataset).to.be.eql({
      id: data.name,
      name: data.name,
      displayName: data.name,
      description: null,
      access: null,
      type: null,
      url: null,
      variables: null,
      groups: []
    });
    this.currentDataset = queryOne.dataset;

    // check on keycloak
    const roles = await this.kcAdminClient.groups.listRealmRoleMappings({
      realm: process.env.KC_REALM,
      id: process.env.KC_EVERYONE_GROUP_ID
    });
    expect(roles.find(role => role.name === `ds:${data.name}`)).to.be.not.ok;
  });

  it('create a dataset with props with access = everyone', async () => {
    const data = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      access: 'everyone',
      type: 'git',
      url: faker.internet.url()
    };
    const mutation = await this.graphqlRequest(`
    mutation($data: DatasetCreateInput!){
      createDataset (data: $data) { ${fields} }
    }`, {
      data
    });

    expect(mutation.createDataset).to.be.eql({
      id: data.name,
      groups: [],
      variables: null,
      ...data
    });

    // get one
    const queryOne = await this.graphqlRequest(`
    query($where: DatasetWhereUniqueInput!){
      dataset (where: $where) { ${fields} }
    }`, {
      where: {id: data.name}
    });

    expect(queryOne.dataset).to.be.eql({
      id: data.name,
      groups: [],
      variables: null,
      ...data
    });

    // check on keycloak
    const roles = await this.kcAdminClient.groups.listRealmRoleMappings({
      realm: process.env.KC_REALM,
      id: process.env.KC_EVERYONE_GROUP_ID
    });
    expect(roles.find(role => role.name === `ds:${data.name}`)).to.be.ok;
  });

  it('create a dataset with props with access = admin', async () => {
    const data = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      access: 'admin',
      type: 'git',
      url: faker.internet.url()
    };
    const mutation = await this.graphqlRequest(`
    mutation($data: DatasetCreateInput!){
      createDataset (data: $data) { ${fields} }
    }`, {
      data
    });

    expect(mutation.createDataset).to.be.eql({
      id: data.name,
      groups: [],
      variables: null,
      ...data
    });

    // get one
    const queryOne = await this.graphqlRequest(`
    query($where: DatasetWhereUniqueInput!){
      dataset (where: $where) { ${fields} }
    }`, {
      where: {id: data.name}
    });

    expect(queryOne.dataset).to.be.eql({
      id: data.name,
      groups: [],
      variables: null,
      ...data
    });

    // check on keycloak
    const roles = await this.kcAdminClient.groups.listRealmRoleMappings({
      realm: process.env.KC_REALM,
      id: process.env.KC_EVERYONE_GROUP_ID
    });
    expect(roles.find(role => role.name === `ds:${data.name}`)).to.be.ok;
  });

  it('update a dataset with variables', async () => {
    const data = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      access: 'admin',
      type: 'env',
      variables: {
        first: 'first'
      }
    };
    const mutation = await this.graphqlRequest(`
    mutation($data: DatasetCreateInput!){
      createDataset (data: $data) { ${fields} }
    }`, {
      data
    });

    expect(mutation.createDataset).to.be.deep.equal({
      id: data.name,
      url: null,
      groups: [],
      ...data
    });
    const dataset = mutation.createDataset;

    // add member to variables
    await this.graphqlRequest(`
    mutation($where: DatasetWhereUniqueInput!, $data: DatasetUpdateInput!){
      updateDataset (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: dataset.id},
      data: {
        variables: {
          first: 'first',
          second: 'second'
        }
      }
    });

    // query
    const queryOne = await this.graphqlRequest(`
    query($where: DatasetWhereUniqueInput!){
      dataset (where: $where) { id variables }
    }`, {
      where: {id: dataset.id}
    });

    expect(queryOne.dataset.variables).to.be.eql({
      first: 'first',
      second: 'second'
    });

    // delete one member, update one and add one
    await this.graphqlRequest(`
    mutation($where: DatasetWhereUniqueInput!, $data: DatasetUpdateInput!){
      updateDataset (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: dataset.id},
      data: {
        variables: {
          second: 'second-second',
          third: 'third'
        }
      }
    });

    // query
    const queryTwo = await this.graphqlRequest(`
    query($where: DatasetWhereUniqueInput!){
      dataset (where: $where) { id variables }
    }`, {
      where: {id: dataset.id}
    });

    expect(queryTwo.dataset.variables).to.be.eql({
      second: 'second-second',
      third: 'third'
    });
  });

  it('should query with where', async () => {
    const queryOne = await this.graphqlRequest(`
    query($where: DatasetWhereUniqueInput!){
      dataset (where: $where) { ${fields} }
    }`, {
      where: {id: this.currentDataset.id}
    });

    expect(queryOne.dataset).to.be.eql(this.currentDataset);
  });

  it('should create with name-only and update', async () => {
    const createMutation = await this.graphqlRequest(`
    mutation($data: DatasetCreateInput!){
      createDataset (data: $data) { ${fields} }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-')
      }
    });

    // update
    const dataset = createMutation.createDataset;
    const data = {
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      access: 'everyone',
      type: 'git',
      url: faker.internet.url()
    };
    const mutation = await this.graphqlRequest(`
    mutation($where: DatasetWhereUniqueInput!, $data: DatasetUpdateInput!){
      updateDataset (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: dataset.id},
      data
    });

    expect(mutation.updateDataset).to.deep.include(data);

    // query one
    const queryOne = await this.graphqlRequest(`
    query($where: DatasetWhereUniqueInput!){
      dataset (where: $where) { ${fields} }
    }`, {
      where: {id: dataset.id}
    });

    expect(queryOne.dataset).to.deep.include(data);

    // check on keycloak
    const roles = await this.kcAdminClient.groups.listRealmRoleMappings({
      realm: process.env.KC_REALM,
      id: process.env.KC_EVERYONE_GROUP_ID
    });
    expect(roles.find(role => role.name === `ds:${dataset.name}`)).to.be.ok;
  });

  it('should create with props and update', async () => {
    const createMutation = await this.graphqlRequest(`
    mutation($data: DatasetCreateInput!){
      createDataset (data: $data) { ${fields} }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
        displayName: faker.internet.userName(),
        description: faker.lorem.sentence(),
        access: 'everyone',
        type: 'git',
        url: faker.internet.url()
      }
    });

    // update
    const dataset = createMutation.createDataset;
    const data = {
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      access: 'group',
      type: 'git',
      url: faker.internet.url()
    };
    const mutation = await this.graphqlRequest(`
    mutation($where: DatasetWhereUniqueInput!, $data: DatasetUpdateInput!){
      updateDataset (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: dataset.id},
      data
    });

    expect(mutation.updateDataset).to.deep.include(data);

    // query one
    const queryOne = await this.graphqlRequest(`
    query($where: DatasetWhereUniqueInput!){
      dataset (where: $where) { ${fields} }
    }`, {
      where: {id: dataset.id}
    });

    expect(queryOne.dataset).to.deep.include(data);

    // check on keycloak
    const roles = await this.kcAdminClient.groups.listRealmRoleMappings({
      realm: process.env.KC_REALM,
      id: process.env.KC_EVERYONE_GROUP_ID
    });
    expect(roles.find(role => role.name === `ds:${dataset.name}`)).to.be.not.ok;
  });

  it('should update dataset access multiple times', async () => {
    const createMutation = await this.graphqlRequest(`
    mutation($data: DatasetCreateInput!){
      createDataset (data: $data) { ${fields} }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
        displayName: faker.internet.userName(),
        description: faker.lorem.sentence(),
        access: 'group',
        type: 'git',
        url: faker.internet.url()
      }
    });

    // update to group
    const dataset = createMutation.createDataset;
    const data = {
      access: 'group'
    };
    const mutation = await this.graphqlRequest(`
    mutation($where: DatasetWhereUniqueInput!, $data: DatasetUpdateInput!){
      updateDataset (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: dataset.id},
      data
    });

    // check on keycloak
    let roles = await this.kcAdminClient.groups.listRealmRoleMappings({
      realm: process.env.KC_REALM,
      id: process.env.KC_EVERYONE_GROUP_ID
    });
    expect(roles.find(role => role.name === `ds:${dataset.name}`)).to.be.not.ok;

    // update to admin
    await this.graphqlRequest(`
    mutation($where: DatasetWhereUniqueInput!, $data: DatasetUpdateInput!){
      updateDataset (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: dataset.id},
      data: {
        access: 'admin'
      }
    });

    // check on keycloak
    roles = await this.kcAdminClient.groups.listRealmRoleMappings({
      realm: process.env.KC_REALM,
      id: process.env.KC_EVERYONE_GROUP_ID
    });
    expect(roles.find(role => role.name === `ds:${dataset.name}`)).to.be.ok;

    // update to everyone
    await this.graphqlRequest(`
    mutation($where: DatasetWhereUniqueInput!, $data: DatasetUpdateInput!){
      updateDataset (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: dataset.id},
      data: {
        access: 'everyone'
      }
    });

    // check on keycloak
    roles = await this.kcAdminClient.groups.listRealmRoleMappings({
      realm: process.env.KC_REALM,
      id: process.env.KC_EVERYONE_GROUP_ID
    });
    expect(roles.find(role => role.name === `ds:${dataset.name}`)).to.be.ok;
  });

  it('should delete dataset', async () => {
    const mutation = await this.graphqlRequest(`
    mutation($where: DatasetWhereUniqueInput!){
      deleteDataset (where: $where) { id }
    }`, {
      where: {id: this.currentDataset.id}
    });

    // query
    const data = await this.graphqlRequest(`
    query ($where: DatasetWhereUniqueInput!) {
      dataset (where: $where) { ${fields} }
    }`, {
      where: {id: this.currentDataset.id}
    });

    expect(data.dataset).to.be.null;
  });
});
