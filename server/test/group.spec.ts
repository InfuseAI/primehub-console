// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import faker from 'faker';

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
    currentGroup?: any;
  }
}

describe('group graphql', function() {
  this.timeout(5000);
  before(() => {
    this.graphqlRequest = (global as any).graphqlRequest;
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
      displayName: groupData.name,
      canUseGpu: false,
      cpuQuota: 0,
      gpuQuota: 0,
      diskQuota: '10GB',
      users: []
    });
    this.currentGroup = data.createGroup;
  });

  it('should add a group with all props', async () => {
    const groupData = {
      name: faker.internet.userName().toLowerCase(),
      displayName: faker.internet.userName(),
      canUseGpu: true,
      cpuQuota: 10,
      gpuQuota: 10,
      diskQuota: '20GB'
    };
    const data = await this.graphqlRequest(`
    mutation($data: GroupCreateInput!){
      createGroup (data: $data) { ${groupFields} }
    }`, {
      data: groupData
    });

    expect(data.createGroup).to.be.deep.include(groupData);
  });

  it('should list groups', async () => {
    const data = await this.graphqlRequest(`
    query {
      groups { ${groupFields} }
    }`);

    expect(data.groups.length).to.be.least(1);
  });

  it('should list groups by where', async () => {
    const data = await this.graphqlRequest(`
    query ($where: GroupWhereInput!) {
      groups (where: $where) { ${groupFields} }
    }`, {
      where: {id: this.currentGroup.id}
    });

    expect(data.groups.length).to.be.equals(1);
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
      cpuQuota: 20,
      gpuQuota: 20,
      diskQuota: '30GB'
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
        diskQuota: '20GB'
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
      diskQuota: '30GB'
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
