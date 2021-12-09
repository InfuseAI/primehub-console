// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import faker from 'faker';
import KeycloakAdminClient from 'keycloak-admin';

chai.use(chaiHttp);

const expect = chai.expect;

// utils
const groupFields = `
  id
  name
  displayName
  quotaCpu
  quotaGpu
  quotaMemory
  projectQuotaGpu
  projectQuotaCpu
  projectQuotaMemory
  enabledSharedVolume
  sharedVolumeCapacity
  homeSymlink
  launchGroupOnly
  users {
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
  }`;

// interface

declare module 'mocha' {
  // tslint:disable-next-line:interface-name
  interface ISuiteCallbackContext {
    graphqlRequest?: (query: string, variables?: any) => Promise<any>;
    kcAdminClient?: KeycloakAdminClient;
    currentGroup?: any;
  }
}

describe('group graphql', function() {
  before(async () => {
    this.graphqlRequest = (global as any).graphqlRequest;
    this.kcAdminClient = (global as any).kcAdminClient;
    await (global as any).authKcAdmin();
  });

  it('should expect empty groups when query', async () => {
    const data = await this.graphqlRequest(`{
      groups {${groupFields}}
    }`);
    expect(data.groups.length).to.be.least(0);
  });

  it('should add a group with only name', async () => {
    const groupData = {
      name: faker.internet.userName().toLowerCase()
    };
    const data = await this.graphqlRequest(`
    mutation($data: GroupCreateInput!){
      createGroup (data: $data) { ${groupFields} }
    }`, {
      data: groupData
    });

    expect(data.createGroup).to.be.deep.include({
      name: groupData.name,
      // displayName default to name
      displayName: null,
      quotaCpu: null,
      quotaGpu: null,
      quotaMemory: null,
      projectQuotaGpu: null,
      projectQuotaCpu: null,
      projectQuotaMemory: null,
      enabledSharedVolume: false,
      sharedVolumeCapacity: null,
      homeSymlink: null,
      launchGroupOnly: null,
      users: []
    });
    this.currentGroup = data.createGroup;
  });

  it('should add a group with all props', async () => {
    const groupData = {
      name: faker.internet.userName().toLowerCase(),
      displayName: faker.internet.userName(),
      quotaCpu: 10.5,
      quotaGpu: 10,
      quotaMemory: 1.5,
      projectQuotaGpu: 10,
      projectQuotaCpu: 1.5,
      projectQuotaMemory: 0.5,
      enabledSharedVolume: true,
      sharedVolumeCapacity: 200,
      launchGroupOnly: true
    };
    const data = await this.graphqlRequest(`
    mutation($data: GroupCreateInput!){
      createGroup (data: $data) { ${groupFields} }
    }`, {
      data: groupData
    });

    expect(data.createGroup).to.be.deep.include(groupData);

    // check api-only field homeSymlink as well
    expect(data.createGroup.homeSymlink).to.be.equal(true);

    const group = await this.kcAdminClient.groups.findOne({realm: process.env.KC_REALM, id: data.createGroup.id});
    expect(group.attributes['quota-cpu'][0]).to.be.equals('10.5');
    expect(group.attributes['quota-gpu'][0]).to.be.equals('10');
    expect(group.attributes['quota-memory'][0]).to.be.equals('1.5G');
    expect(group.attributes['project-quota-cpu'][0]).to.be.equals('1.5');
    expect(group.attributes['project-quota-gpu'][0]).to.be.equals('10');
    expect(group.attributes['project-quota-memory'][0]).to.be.equals('0.5G');

    // check shared volume related
    expect(group.attributes['enabled-shared-volume'][0]).to.be.equals('true');
    expect(group.attributes['shared-volume-capacity'][0]).to.be.equals('200G');
    expect(group.attributes['home-symlink'][0]).to.be.equals('true');
    expect(group.attributes['launch-group-only'][0]).to.be.equals('true');

    this.currentGroup = data.createGroup;
  });

  it('should list groups', async () => {
    const data = await this.graphqlRequest(`
    query {
      groups { ${groupFields} }
    }`);

    expect(data.groups.length).to.be.least(1);
  });

  it('should list groups by where id equals', async () => {
    const data = await this.graphqlRequest(`
    query ($where: GroupWhereInput!) {
      groups (where: $where) { ${groupFields} }
    }`, {
      where: {id: this.currentGroup.id}
    });

    expect(data.groups.length).to.be.equals(1);
  });

  it('should query groups with where contains name', async () => {
    const group = this.currentGroup;
    const data = await this.graphqlRequest(`
    query ($where: GroupWhereInput!){
      groups(where: $where) { ${groupFields} }
    }`, {
      where: {
        name_contains: 'notExist'
      }
    });

    expect(data.groups.length).to.be.equals(0);

    // prefix
    const prefixData = await this.graphqlRequest(`
    query ($where: GroupWhereInput!){
      groups(where: $where) { ${groupFields} }
    }`, {
      where: {
        name_contains: group.name.slice(0, 4)
      }
    });

    expect(prefixData.groups.length).to.be.least(1);

    // postfix
    const postfixData = await this.graphqlRequest(`
    query ($where: GroupWhereInput!){
      groups(where: $where) { ${groupFields} }
    }`, {
      where: {
        name_contains: group.name.slice(2)
      }
    });

    expect(postfixData.groups.length).to.be.equals(1);

    // middle
    const middleData = await this.graphqlRequest(`
    query ($where: GroupWhereInput!){
      groups(where: $where) { ${groupFields} }
    }`, {
      where: {
        name_contains: group.name.slice(2, -1)
      }
    });

    expect(middleData.groups.length).to.be.equals(1);
  });

  it('should list groups with where contains name and check quotas', async () => {
    const data = await this.graphqlRequest(`
    query ($where: GroupWhereInput!) {
      groups (where: $where) { ${groupFields} }
    }`, {
      where: {name_contains: this.currentGroup.name}
    });

    expect(data.groups.length).to.be.equals(1);

    const group = data.groups[0];
    expect(group.quotaCpu).to.be.equals(10.5);
    expect(group.quotaGpu).to.be.equals(10);
    expect(group.quotaMemory).to.be.equals(1.5);
    expect(group.projectQuotaCpu).to.be.equals(1.5);
    expect(group.projectQuotaGpu).to.be.equals(10);
    expect(group.projectQuotaMemory).to.be.equals(0.5);
  });

  it('should get a group', async () => {
    const data = await this.graphqlRequest(`
    query ($where: GroupWhereUniqueInput!) {
      group (where: $where) { ${groupFields} }
    }`, {
      where: {id: this.currentGroup.id}
    });

    expect(data.group).to.be.deep.include(this.currentGroup);
  });

  it('should create with name-only and update a group', async () => {
    const create = await this.graphqlRequest(`
    mutation($data: GroupCreateInput!){
      createGroup (data: $data) { ${groupFields} }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase()
      }
    });
    const groupId = create.createGroup.id;

    // update
    const updated = {
      displayName: faker.internet.userName(),
      quotaCpu: 20.5,
      quotaGpu: 20,
      projectQuotaGpu: 10,
      enabledSharedVolume: true,
      sharedVolumeCapacity: 200,
      launchGroupOnly: true
    };
    await this.graphqlRequest(`
    mutation($where: GroupWhereUniqueInput!, $data: GroupUpdateInput!){
      updateGroup (where: $where, data: $data) { ${groupFields} }
    }`, {
      where: {id: groupId},
      data: updated
    });

    // query
    const data = await this.graphqlRequest(`
    query ($where: GroupWhereUniqueInput!) {
      group (where: $where) { ${groupFields} }
    }`, {
      where: {id: groupId}
    });

    expect(data.group).to.be.deep.include(updated);

    // check api-only field homeSymlink as well
    expect(data.group.homeSymlink).to.be.equal(true);

    const group = await this.kcAdminClient.groups.findOne({realm: process.env.KC_REALM, id: groupId});
    expect(group.attributes['quota-cpu'][0]).to.be.equals('20.5');
    expect(group.attributes['quota-gpu'][0]).to.be.equals('20');
    expect(group.attributes['project-quota-gpu'][0]).to.be.equals('10');

    // check shared volume related
    expect(group.attributes['enabled-shared-volume'][0]).to.be.equals('true');
    expect(group.attributes['shared-volume-capacity'][0]).to.be.equals('200G');
    expect(group.attributes['home-symlink'][0]).to.be.equals('true');
    expect(group.attributes['launch-group-only'][0]).to.be.equals('true');
  });

  it('should create with all props and update a group', async () => {
    const create = await this.graphqlRequest(`
    mutation($data: GroupCreateInput!){
      createGroup (data: $data) { ${groupFields} }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase(),
        displayName: faker.internet.userName(),
        quotaCpu: 10,
        quotaGpu: 10,
        quotaMemory: 1.5,
        projectQuotaGpu: null,
        projectQuotaCpu: 10,
        projectQuotaMemory: null,
        enabledSharedVolume: true,
        sharedVolumeCapacity: 200,
        launchGroupOnly: true
      }
    });
    const groupId = create.createGroup.id;

    // update
    const updated = {
      displayName: faker.internet.userName(),
      quotaCpu: 20,
      quotaGpu: 20,
      quotaMemory: null,
      projectQuotaGpu: 10,
      projectQuotaCpu: 0.5,
      projectQuotaMemory: 5,
      sharedVolumeCapacity: 300,
      launchGroupOnly: false
    };
    await this.graphqlRequest(`
    mutation($where: GroupWhereUniqueInput!, $data: GroupUpdateInput!){
      updateGroup (where: $where, data: $data) { ${groupFields} }
    }`, {
      where: {id: groupId},
      data: updated
    });

    // query
    const data = await this.graphqlRequest(`
    query ($where: GroupWhereUniqueInput!) {
      group (where: $where) { ${groupFields} }
    }`, {
      where: {id: groupId}
    });

    expect(data.group).to.be.deep.include(updated);

    let group = await this.kcAdminClient.groups.findOne({realm: process.env.KC_REALM, id: groupId});
    expect(group.attributes['quota-cpu'][0]).to.be.equals('20');
    expect(group.attributes['quota-gpu'][0]).to.be.equals('20');
    expect(group.attributes['quota-memory']).to.be.undefined;
    expect(group.attributes['project-quota-gpu'][0]).to.be.equals('10');
    expect(group.attributes['project-quota-cpu'][0]).to.be.equals('0.5');
    expect(group.attributes['project-quota-memory'][0]).to.be.equals('5G');

    // check shared volume related
    expect(group.attributes['enabled-shared-volume'][0]).to.be.equals('true');
    expect(group.attributes['shared-volume-capacity'][0]).to.be.equals('300G');
    expect(group.attributes['home-symlink'][0]).to.be.equals('true');
    expect(group.attributes['launch-group-only'][0]).to.be.equals('false');

    // update again
    const updatedAgain = {
      quotaCpu: null,
      quotaMemory: null,
      quotaGpu: 2,
      projectQuotaMemory: 0.5,
      enabledSharedVolume: false
    };
    await this.graphqlRequest(`
    mutation($where: GroupWhereUniqueInput!, $data: GroupUpdateInput!){
      updateGroup (where: $where, data: $data) { ${groupFields} }
    }`, {
      where: {id: groupId},
      data: updatedAgain
    });

    // query
    const dataAgain = await this.graphqlRequest(`
    query ($where: GroupWhereUniqueInput!) {
      group (where: $where) { ${groupFields} }
    }`, {
      where: {id: groupId}
    });

    expect(dataAgain.group).to.be.deep.include(updatedAgain);

    group = await this.kcAdminClient.groups.findOne({realm: process.env.KC_REALM, id: groupId});
    expect(group.attributes['quota-cpu']).to.be.undefined;
    expect(group.attributes['quota-gpu'][0]).to.be.equals('2');
    expect(group.attributes['quota-memory']).to.be.undefined;
    expect(group.attributes['project-quota-gpu'][0]).to.be.equals('10');
    expect(group.attributes['project-quota-cpu'][0]).to.be.equals('0.5');
    expect(group.attributes['project-quota-memory'][0]).to.be.equals('0.5G');

    // check shared volume related
    expect(group.attributes['enabled-shared-volume'][0]).to.be.equals('false');
    expect(group.attributes['shared-volume-capacity'][0]).to.be.equals('300G');
    expect(group.attributes['home-symlink'][0]).to.be.equals('true');
    expect(group.attributes['launch-group-only'][0]).to.be.equals('false');
  });

  it('should create with default launchGroupOnly', async () => {
    const create = await this.graphqlRequest(`
    mutation($data: GroupCreateInput!){
      createGroup (data: $data) { ${groupFields} }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase(),
        displayName: faker.internet.userName(),
        enabledSharedVolume: true,
        sharedVolumeCapacity: 1,
      }
    });
    const groupId = create.createGroup.id;

    // query
    const data = await this.graphqlRequest(`
    query ($where: GroupWhereUniqueInput!) {
      group (where: $where) { ${groupFields} }
    }`, {
      where: {id: groupId}
    });

    let group = await this.kcAdminClient.groups.findOne({realm: process.env.KC_REALM, id: groupId});
    expect(group.attributes['launch-group-only'][0]).to.be.equals('true');
  });

  it('should update with default launchGroupOnly', async () => {
    const create = await this.graphqlRequest(`
    mutation($data: GroupCreateInput!){
      createGroup (data: $data) { ${groupFields} }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase(),
        displayName: faker.internet.userName(),
      }
    });
    const groupId = create.createGroup.id;

    // update
    const updated = {
      displayName: faker.internet.userName(),
      enabledSharedVolume: true,
      sharedVolumeCapacity: 1,
    };
    await this.graphqlRequest(`
    mutation($where: GroupWhereUniqueInput!, $data: GroupUpdateInput!){
      updateGroup (where: $where, data: $data) { ${groupFields} }
    }`, {
      where: {id: groupId},
      data: updated
    });

    // query
    const data = await this.graphqlRequest(`
    query ($where: GroupWhereUniqueInput!) {
      group (where: $where) { ${groupFields} }
    }`, {
      where: {id: groupId}
    });

    let group = await this.kcAdminClient.groups.findOne({realm: process.env.KC_REALM, id: groupId});
    expect(group.attributes['launch-group-only'][0]).to.be.equals('true');
  });

  it('should delete a group', async () => {
    await this.graphqlRequest(`
    mutation($where: GroupWhereUniqueInput!){
      deleteGroup (where: $where) { id }
    }`, {
      where: {id: this.currentGroup.id}
    });

    // query
    const data = await this.graphqlRequest(`
    query ($where: GroupWhereUniqueInput!) {
      group (where: $where) { ${groupFields} }
    }`, {
      where: {id: this.currentGroup.id}
    });

    expect(data.group).to.be.null;
  });
});
