// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import faker from 'faker';
import KeycloakAdminClient from 'keycloak-admin';
import { cleanupDatasets } from './sandbox';
import { pick } from 'lodash';
import CrdClient from '../src/crdClient/crdClientImpl';
import { ATTRIBUTE_PREFIX } from '../src/resolvers/dataset';

chai.use(chaiHttp);

const expect = chai.expect;

// utils
const fields = `
  id
  name
  displayName
  description
  global
  type
  url
  variables
  mountRoot
  homeSymlink
  launchGroupOnly
  spec
  volumeSize
  groups {
    id
    name
    displayName
    quotaCpu
    quotaGpu
    userVolumeCapacity
    writable
  }`;

declare module 'mocha' {
  // tslint:disable-next-line:interface-name
  interface ISuiteCallbackContext {
    graphqlRequest?: (query: string, variables?: any) => Promise<any>;
    currentDataset?: any;
    createGroup?: any;
    kcAdminClient?: KeycloakAdminClient;
    crdClient: CrdClient;
  }
}

describe('dataset graphql', function() {
  before(async () => {
    this.graphqlRequest = (global as any).graphqlRequest;
    this.kcAdminClient = (global as any).kcAdminClient;
    this.crdClient = (global as any).crdClient;
    this.createGroup = async () => {
      const data = await this.graphqlRequest(`
      mutation($data: GroupCreateInput!){
        createGroup (data: $data) { id name }
      }`, {
        data: {
          name: faker.internet.userName().toLowerCase()
        }
      });
      return data.createGroup;
    };
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
      createDataset (data: $data) { id }
    }`, {
      data
    });

    expect(mutation.createDataset.id).to.be.equal(data.name);

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
      volumeSize: null,
      global: false,
      type: null,
      url: null,
      variables: null,
      mountRoot: '',
      homeSymlink: false,
      launchGroupOnly: false,
      spec: {
        displayName: data.name,
        volumeName: data.name
      },
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

  it('create a dataset with props with global = true', async () => {
    const data = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      global: true,
      type: 'git',
      url: faker.internet.url()
    };
    const mutation = await this.graphqlRequest(`
    mutation($data: DatasetCreateInput!){
      createDataset (data: $data) { id }
    }`, {
      data
    });

    expect(mutation.createDataset.id).to.be.equal(data.name);

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
      volumeSize: null,
      variables: null,
      mountRoot: '',
      homeSymlink: false,
      launchGroupOnly: false,
      spec: {
        ...pick(data, ['displayName', 'description', 'type', 'url', 'variables']),
        volumeName: data.name
      },
      ...data
    });

    // check on keycloak
    const roles = await this.kcAdminClient.groups.listRealmRoleMappings({
      realm: process.env.KC_REALM,
      id: process.env.KC_EVERYONE_GROUP_ID
    });
    expect(roles.find(role => role.name === `ds:${data.name}`)).to.be.ok;
  });

  it('create a dataset with props with global = false', async () => {
    const data = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      global: false,
      type: 'git',
      url: faker.internet.url()
    };
    const mutation = await this.graphqlRequest(`
    mutation($data: DatasetCreateInput!){
      createDataset (data: $data) { id }
    }`, {
      data
    });

    expect(mutation.createDataset.id).to.be.equal(data.name);

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
      volumeSize: null,
      variables: null,
      mountRoot: '',
      homeSymlink: false,
      launchGroupOnly: false,
      spec: {
        ...pick(data, ['displayName', 'description', 'type', 'url', 'variables']),
        volumeName: data.name
      },
      ...data
    });

    // check on keycloak
    const roles = await this.kcAdminClient.groups.listRealmRoleMappings({
      realm: process.env.KC_REALM,
      id: process.env.KC_EVERYONE_GROUP_ID
    });
    expect(roles.find(role => role.name === `ds:${data.name}`)).to.be.not.ok;
  });

  it('update a dataset with variables', async () => {
    const data = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      global: false,
      type: 'env',
      variables: {
        first: 'first'
      }
    };
    const mutation = await this.graphqlRequest(`
    mutation($data: DatasetCreateInput!){
      createDataset (data: $data) { id }
    }`, {
      data
    });

    expect(mutation.createDataset.id).to.be.equal(data.name);
    const datasetId = mutation.createDataset.id;

    // add member to variables
    await this.graphqlRequest(`
    mutation($where: DatasetWhereUniqueInput!, $data: DatasetUpdateInput!){
      updateDataset (where: $where, data: $data) { id }
    }`, {
      where: {id: datasetId},
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
      where: {id: datasetId}
    });

    expect(queryOne.dataset.variables).to.be.eql({
      first: 'first',
      second: 'second'
    });

    // delete one member, update one and add one
    await this.graphqlRequest(`
    mutation($where: DatasetWhereUniqueInput!, $data: DatasetUpdateInput!){
      updateDataset (where: $where, data: $data) { id }
    }`, {
      where: {id: datasetId},
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
      where: {id: datasetId}
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
      createDataset (data: $data) { id }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-')
      }
    });

    // update
    const datasetId = createMutation.createDataset.id;
    const data = {
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      global: true,
      type: 'git',
      url: faker.internet.url()
    };
    const mutation = await this.graphqlRequest(`
    mutation($where: DatasetWhereUniqueInput!, $data: DatasetUpdateInput!){
      updateDataset (where: $where, data: $data) { id }
    }`, {
      where: {id: datasetId},
      data
    });

    expect(mutation.updateDataset.id).to.equal(datasetId);

    // query one
    const queryOne = await this.graphqlRequest(`
    query($where: DatasetWhereUniqueInput!){
      dataset (where: $where) { ${fields} }
    }`, {
      where: {id: datasetId}
    });

    expect(queryOne.dataset).to.deep.include(data);

    // check on keycloak
    const roles = await this.kcAdminClient.groups.listRealmRoleMappings({
      realm: process.env.KC_REALM,
      id: process.env.KC_EVERYONE_GROUP_ID
    });
    expect(roles.find(role => role.name === `ds:${datasetId}`)).to.be.ok;
  });

  it('should create with props and update', async () => {
    const createMutation = await this.graphqlRequest(`
    mutation($data: DatasetCreateInput!){
      createDataset (data: $data) { id }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
        displayName: faker.internet.userName(),
        description: faker.lorem.sentence(),
        global: true,
        type: 'git',
        url: faker.internet.url()
      }
    });

    // update
    const datasetId = createMutation.createDataset.id;
    const data = {
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      global: false,
      type: 'git',
      url: faker.internet.url()
    };
    const mutation = await this.graphqlRequest(`
    mutation($where: DatasetWhereUniqueInput!, $data: DatasetUpdateInput!){
      updateDataset (where: $where, data: $data) { id }
    }`, {
      where: {id: datasetId},
      data
    });

    expect(mutation.updateDataset.id).to.equal(datasetId);

    // query one
    const queryOne = await this.graphqlRequest(`
    query($where: DatasetWhereUniqueInput!){
      dataset (where: $where) { ${fields} }
    }`, {
      where: {id: datasetId}
    });

    expect(queryOne.dataset).to.deep.include(data);

    // check on keycloak
    const roles = await this.kcAdminClient.groups.listRealmRoleMappings({
      realm: process.env.KC_REALM,
      id: process.env.KC_EVERYONE_GROUP_ID
    });
    expect(roles.find(role => role.name === `ds:${datasetId}`)).to.be.not.ok;
  });

  it('should update dataset global multiple times', async () => {
    const createMutation = await this.graphqlRequest(`
    mutation($data: DatasetCreateInput!){
      createDataset (data: $data) { id }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
        displayName: faker.internet.userName(),
        description: faker.lorem.sentence(),
        global: false,
        type: 'git',
        url: faker.internet.url()
      }
    });

    // update global to false
    const datasetId = createMutation.createDataset.id;
    const data = {
      global: false
    };
    await this.graphqlRequest(`
    mutation($where: DatasetWhereUniqueInput!, $data: DatasetUpdateInput!){
      updateDataset (where: $where, data: $data) { id }
    }`, {
      where: {id: datasetId},
      data
    });

    // check on keycloak
    let roles = await this.kcAdminClient.groups.listRealmRoleMappings({
      realm: process.env.KC_REALM,
      id: process.env.KC_EVERYONE_GROUP_ID
    });
    expect(roles.find(role => role.name === `ds:${datasetId}`)).to.be.not.ok;

    // update global to true
    await this.graphqlRequest(`
    mutation($where: DatasetWhereUniqueInput!, $data: DatasetUpdateInput!){
      updateDataset (where: $where, data: $data) { id }
    }`, {
      where: {id: datasetId},
      data: {
        global: true
      }
    });

    // check on keycloak
    roles = await this.kcAdminClient.groups.listRealmRoleMappings({
      realm: process.env.KC_REALM,
      id: process.env.KC_EVERYONE_GROUP_ID
    });
    expect(roles.find(role => role.name === `ds:${datasetId}`)).to.be.ok;

    // update to true
    await this.graphqlRequest(`
    mutation($where: DatasetWhereUniqueInput!, $data: DatasetUpdateInput!){
      updateDataset (where: $where, data: $data) { id }
    }`, {
      where: {id: datasetId},
      data: {
        global: true
      }
    });

    // check on keycloak
    roles = await this.kcAdminClient.groups.listRealmRoleMappings({
      realm: process.env.KC_REALM,
      id: process.env.KC_EVERYONE_GROUP_ID
    });
    expect(roles.find(role => role.name === `ds:${datasetId}`)).to.be.ok;
  });

  it('should delete dataset', async () => {
    await this.graphqlRequest(`
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

  it('add a pv dataset and connect with groups', async () => {
    const data = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      global: false,
      type: 'pv',
      volumeSize: 1,
      url: faker.internet.url()
    };
    const createMutation = await this.graphqlRequest(`
    mutation($data: DatasetCreateInput!){
      createDataset (data: $data) { id }
    }`, {
      data
    });

    // update with connect
    const group = await this.createGroup();
    const datasetId = createMutation.createDataset.id;
    await this.graphqlRequest(`
    mutation($where: DatasetWhereUniqueInput!, $data: DatasetUpdateInput!){
      updateDataset (where: $where, data: $data) { id }
    }`, {
      where: {id: datasetId},
      data: {
        groups: {
          connect: [{
            id: group.id
          }]
        }
      }
    });

    // get one
    const queryOne = await this.graphqlRequest(`
    query($where: DatasetWhereUniqueInput!){
      dataset (where: $where) { ${fields} }
    }`, {
      where: {id: datasetId}
    });

    expect(queryOne.dataset).to.be.deep.include({
      id: data.name,
      groups: [{
        id: group.id,
        displayName: null,
        name: group.name,
        quotaCpu: null,
        userVolumeCapacity: null,
        quotaGpu: null,
        writable: false
      }],
      ...data,
    });

    // connect with second group
    const secGroup = await this.createGroup();

    // update with writable
    await this.graphqlRequest(`
    mutation($where: DatasetWhereUniqueInput!, $data: DatasetUpdateInput!){
      updateDataset (where: $where, data: $data) { id }
    }`, {
      where: {id: datasetId},
      data: {
        groups: {
          connect: [{
            id: secGroup.id,
            writable: true
          }]
        }
      }
    });

    // get one
    const queryOneAgain = await this.graphqlRequest(`
    query($where: DatasetWhereUniqueInput!){
      dataset (where: $where) { ${fields} }
    }`, {
      where: {id: datasetId}
    });

    expect(queryOneAgain.dataset).to.be.deep.include({
      id: data.name,
      ...data,
    });
    expect(queryOneAgain.dataset.groups).to.deep.include.members([{
      id: group.id,
      displayName: null,
      name: group.name,
      quotaCpu: null,
      userVolumeCapacity: null,
      quotaGpu: null,
      writable: false
    }, {
      id: secGroup.id,
      displayName: null,
      name: secGroup.name,
      quotaCpu: null,
      userVolumeCapacity: null,
      quotaGpu: null,
      writable: true
    }]);

    // check keycloak
    const roles = await this.kcAdminClient.groups.listRealmRoleMappings({
      realm: process.env.KC_REALM,
      id: group.id
    });
    expect(roles.find(role => role.name === `ds:${datasetId}`)).to.be.ok;
    expect(roles.find(role => role.name === `ds:rw:${datasetId}`)).to.be.not.ok;
    const secGroupRoles = await this.kcAdminClient.groups.listRealmRoleMappings({
      realm: process.env.KC_REALM,
      id: secGroup.id
    });
    expect(secGroupRoles.find(role => role.name === `ds:${datasetId}`)).to.be.not.ok;
    expect(secGroupRoles.find(role => role.name === `ds:rw:${datasetId}`)).to.be.ok;
  });

  it('add a pv dataset and connect with writable groups, then disconnect', async () => {
    const data = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      global: false,
      type: 'pv',
      volumeSize: 1,
      url: faker.internet.url()
    };
    const createMutation = await this.graphqlRequest(`
    mutation($data: DatasetCreateInput!){
      createDataset (data: $data) { id }
    }`, {
      data
    });

    // update with connect
    const group = await this.createGroup();
    const secGroup = await this.createGroup();
    const datasetId = createMutation.createDataset.id;
    await this.graphqlRequest(`
    mutation($where: DatasetWhereUniqueInput!, $data: DatasetUpdateInput!){
      updateDataset (where: $where, data: $data) { id }
    }`, {
      where: {id: datasetId},
      data: {
        groups: {
          connect: [{
            id: group.id,
            writable: false
          }, {
            id: secGroup.id,
            writable: true
          }]
        }
      }
    });

    // get one
    const queryOne = await this.graphqlRequest(`
    query($where: DatasetWhereUniqueInput!){
      dataset (where: $where) { ${fields} }
    }`, {
      where: {id: datasetId}
    });

    expect(queryOne.dataset).to.be.deep.include({
      id: data.name,
      ...data,
    });
    expect(queryOne.dataset.groups).to.deep.include.members([{
      id: group.id,
      displayName: null,
      name: group.name,
      quotaCpu: null,
      userVolumeCapacity: null,
      quotaGpu: null,
      writable: false
    }, {
      id: secGroup.id,
      displayName: null,
      name: secGroup.name,
      quotaCpu: null,
      userVolumeCapacity: null,
      quotaGpu: null,
      writable: true
    }]);

    // check keycloak
    const roles = await this.kcAdminClient.groups.listRealmRoleMappings({
      realm: process.env.KC_REALM,
      id: group.id
    });
    expect(roles.find(role => role.name === `ds:${datasetId}`)).to.be.ok;
    expect(roles.find(role => role.name === `ds:rw:${datasetId}`)).to.be.not.ok;
    const secGroupRoles = await this.kcAdminClient.groups.listRealmRoleMappings({
      realm: process.env.KC_REALM,
      id: secGroup.id
    });
    expect(secGroupRoles.find(role => role.name === `ds:${datasetId}`)).to.be.not.ok;
    expect(secGroupRoles.find(role => role.name === `ds:rw:${datasetId}`)).to.be.ok;

    // disconnect
    await this.graphqlRequest(`
    mutation($where: DatasetWhereUniqueInput!, $data: DatasetUpdateInput!){
      updateDataset (where: $where, data: $data) { id }
    }`, {
      where: {id: datasetId},
      data: {
        groups: {
          disconnect: [{
            id: group.id
          }, {
            id: secGroup.id
          }]
        }
      }
    });

    // get one
    const queryOneAgain = await this.graphqlRequest(`
    query($where: DatasetWhereUniqueInput!){
      dataset (where: $where) { ${fields} }
    }`, {
      where: {id: datasetId}
    });

    expect(queryOneAgain.dataset).to.be.deep.include({
      id: data.name,
      groups: [],
      ...data,
    });
  });

  it('add a pv dataset and connect with writable groups, then change type', async () => {
    const data = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      global: false,
      type: 'pv',
      volumeSize: 1,
      url: faker.internet.url()
    };
    const createMutation = await this.graphqlRequest(`
    mutation($data: DatasetCreateInput!){
      createDataset (data: $data) { id }
    }`, {
      data
    });

    // update with connect
    const group = await this.createGroup();
    const secGroup = await this.createGroup();
    const datasetId = createMutation.createDataset.id;
    await this.graphqlRequest(`
    mutation($where: DatasetWhereUniqueInput!, $data: DatasetUpdateInput!){
      updateDataset (where: $where, data: $data) { id }
    }`, {
      where: {id: datasetId},
      data: {
        groups: {
          connect: [{
            id: group.id,
            writable: false
          }, {
            id: secGroup.id,
            writable: true
          }]
        }
      }
    });

    // change type
    await this.graphqlRequest(`
    mutation($where: DatasetWhereUniqueInput!, $data: DatasetUpdateInput!){
      updateDataset (where: $where, data: $data) { id }
    }`, {
      where: {id: datasetId},
      data: {
        type: 'git'
      }
    });

    // get one
    const queryOne = await this.graphqlRequest(`
    query($where: DatasetWhereUniqueInput!){
      dataset (where: $where) { ${fields} }
    }`, {
      where: {id: datasetId}
    });

    expect(queryOne.dataset).to.be.deep.include({
      id: data.name,
      ...data,
      volumeSize: null,
      type: 'git'
    });

    expect(queryOne.dataset.groups).to.deep.include.members([{
      id: group.id,
      displayName: null,
      name: group.name,
      quotaCpu: null,
      userVolumeCapacity: null,
      quotaGpu: null,
      writable: false
    }, {
      id: secGroup.id,
      displayName: null,
      name: secGroup.name,
      quotaCpu: null,
      userVolumeCapacity: null,
      quotaGpu: null,
      writable: false
    }]);

    // check keycloak
    const roles = await this.kcAdminClient.groups.listRealmRoleMappings({
      realm: process.env.KC_REALM,
      id: group.id
    });
    expect(roles.find(role => role.name === `ds:${datasetId}`)).to.be.ok;
    expect(roles.find(role => role.name === `ds:rw:${datasetId}`)).to.be.not.ok;
    const secGroupRoles = await this.kcAdminClient.groups.listRealmRoleMappings({
      realm: process.env.KC_REALM,
      id: secGroup.id
    });
    expect(secGroupRoles.find(role => role.name === `ds:${datasetId}`)).to.be.ok;
    expect(secGroupRoles.find(role => role.name === `ds:rw:${datasetId}`)).to.be.not.ok;
  });

  it('should create with dataset options and update', async () => {
    const data = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      global: true,
      url: faker.internet.url(),
      mountRoot: '/datasets',
      launchGroupOnly: false
    };

    const createMutation = await this.graphqlRequest(`
    mutation($data: DatasetCreateInput!){
      createDataset (data: $data) { id }
    }`, {
      data
    });

    // query one
    const queryOne = await this.graphqlRequest(`
    query($where: DatasetWhereUniqueInput!){
      dataset (where: $where) { ${fields} }
    }`, {
      where: {id: createMutation.createDataset.id}
    });

    expect(queryOne.dataset).to.deep.include(data);
    expect(queryOne.dataset.homeSymlink).to.be.equal(false);

    // check on k8s
    const dataset = await this.crdClient.datasets.get(data.name);
    expect(dataset.metadata.annotations[`${ATTRIBUTE_PREFIX}/mountRoot`]).to.be.equals(data.mountRoot);
    expect(dataset.metadata.annotations[`${ATTRIBUTE_PREFIX}/homeSymlink`]).to.be.equals('false');
    expect(
      dataset.metadata.annotations[`${ATTRIBUTE_PREFIX}/launchGroupOnly`])
      .to.be.equals(data.launchGroupOnly.toString());

    // update
    const updateData = {
      launchGroupOnly: true
    };
    await this.graphqlRequest(`
    mutation($where: DatasetWhereUniqueInput!, $data: DatasetUpdateInput!){
      updateDataset (where: $where, data: $data) { id }
    }`, {
      where: {id: createMutation.createDataset.id},
      data: updateData
    });

    // query one
    const queryOneAgain = await this.graphqlRequest(`
    query($where: DatasetWhereUniqueInput!){
      dataset (where: $where) { ${fields} }
    }`, {
      where: {id: createMutation.createDataset.id}
    });

    expect(queryOneAgain.dataset).to.deep.include({...data, ...updateData});

    // check on k8s
    const datasetAgain = await this.crdClient.datasets.get(data.name);
    expect(datasetAgain.metadata.annotations[`${ATTRIBUTE_PREFIX}/mountRoot`]).to.be.equals(data.mountRoot);
    expect(datasetAgain.metadata.annotations[`${ATTRIBUTE_PREFIX}/homeSymlink`]).to.be.equals('false');
    expect(
      datasetAgain.metadata.annotations[`${ATTRIBUTE_PREFIX}/launchGroupOnly`])
      .to.be.equals(updateData.launchGroupOnly.toString());
  });
});
