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
  canUseGpu
  cpuQuota
  gpuQuota
  projectGpuQuota
  diskQuota
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
    personalDiskQuota
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
  this.timeout(5000);
  before(async () => {
    this.graphqlRequest = (global as any).graphqlRequest;
    this.kcAdminClient = (global as any).kcAdminClient;
    await (global as any).authKcAdmin();
  });

  it('should expect empty groups when query', async () => {
    const data = await this.graphqlRequest(`{
      groups {${groupFields}}
    }`);
    expect(data.groups).to.be.eql([]);
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
      canUseGpu: false,
      cpuQuota: 0,
      gpuQuota: 0,
      projectGpuQuota: 0,
      diskQuota: 10,
      users: []
    });
    this.currentGroup = data.createGroup;
  });

  it('should add a group with all props', async () => {
    const groupData = {
      name: faker.internet.userName().toLowerCase(),
      displayName: faker.internet.userName(),
      canUseGpu: true,
      cpuQuota: 10.5,
      gpuQuota: 10,
      projectGpuQuota: 10,
      diskQuota: 20
    };
    const data = await this.graphqlRequest(`
    mutation($data: GroupCreateInput!){
      createGroup (data: $data) { ${groupFields} }
    }`, {
      data: groupData
    });

    expect(data.createGroup).to.be.deep.include(groupData);

    // check diskQuota save as 20G in keycloak
    const group = await this.kcAdminClient.groups.findOne({realm: process.env.KC_REALM, id: data.createGroup.id});
    expect(group.attributes.diskQuota[0]).to.be.equals('20G');
    expect(group.attributes['quota-gpu'][0]).to.be.equals('10');
    expect(group.attributes['project-quota-gpu'][0]).to.be.equals('10');
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

    expect(prefixData.groups.length).to.be.equals(1);

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
      name: faker.internet.userName().toLowerCase(),
      displayName: faker.internet.userName(),
      canUseGpu: false,
      cpuQuota: 20.5,
      gpuQuota: 20,
      projectGpuQuota: 10,
      diskQuota: 30
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

    // check diskQuota save as 30G in keycloak
    const group = await this.kcAdminClient.groups.findOne({realm: process.env.KC_REALM, id: groupId});
    expect(group.attributes.diskQuota[0]).to.be.equals('30G');
    expect(group.attributes['quota-gpu'][0]).to.be.equals('20');
    expect(group.attributes['project-quota-gpu'][0]).to.be.equals('10');
  });

  it('should create with all props and update a group', async () => {
    const create = await this.graphqlRequest(`
    mutation($data: GroupCreateInput!){
      createGroup (data: $data) { ${groupFields} }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase(),
        displayName: faker.internet.userName(),
        canUseGpu: true,
        cpuQuota: 10,
        gpuQuota: 10,
        projectGpuQuota: 10,
        diskQuota: 20
      }
    });
    const groupId = create.createGroup.id;

    // update
    const updated = {
      name: faker.internet.userName().toLowerCase(),
      displayName: faker.internet.userName(),
      canUseGpu: false,
      cpuQuota: 20,
      gpuQuota: 20,
      projectGpuQuota: 10,
      diskQuota: 30
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

    // check diskQuota save as 30G in keycloak
    const group = await this.kcAdminClient.groups.findOne({realm: process.env.KC_REALM, id: groupId});
    expect(group.attributes.diskQuota[0]).to.be.equals('30G');
    expect(group.attributes['quota-gpu'][0]).to.be.equals('20');
    expect(group.attributes['project-quota-gpu'][0]).to.be.equals('10');
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
