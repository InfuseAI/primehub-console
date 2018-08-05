// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import faker from 'faker';

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
  isAdmin
  enabled
  createdTimestamp
  personalDiskQuota
  groups {
    id
    name
    displayName
    canUseGpu
    cpuQuota
    gpuQuota
    diskQuota
  }`;

// interface

declare module 'mocha' {
  // tslint:disable-next-line:interface-name
  interface ISuiteCallbackContext {
    graphqlRequest?: (query: string, variables?: any) => Promise<any>;
    currentUser?: any;
  }
}

describe('user graphql', function() {
  this.timeout(5000);
  before(() => {
    this.graphqlRequest = (global as any).graphqlRequest;
  });

  it('should expect one admin user when query users', async () => {
    const data = await this.graphqlRequest(`{
      users {${userFields}}
    }`);

    const username = process.env.KC_USERNAME;
    expect(data.users.length).to.be.eql(1);
    expect(data.users[0]).to.deep.include({
      username,
      firstName: null,
      lastName: null,
      totp: false,
      isAdmin: true,
      enabled: true,
      groups: []
    });
  });

  it('should add an user', async () => {
    const userData = {
      username: faker.internet.userName().toLowerCase(),
      firstName: faker.name.firstName(),
      email: faker.internet.email().toLowerCase()
    };
    const data = await this.graphqlRequest(`
    mutation($data: UserCreateInput!){
      createUser (data: $data) { ${userFields} }
    }`, {
      data: userData
    });

    expect(data.createUser).to.deep.include({
      ...userData,
      lastName: null,
      totp: false,
      isAdmin: false,
      enabled: true,
      groups: []
    });
    this.currentUser = data.createUser;
  });

  it('should add an user with personalDiskQuota', async () => {
    const userData = {
      username: faker.internet.userName().toLowerCase(),
      firstName: faker.name.firstName(),
      email: faker.internet.email().toLowerCase(),
      personalDiskQuota: '50G'
    };
    const data = await this.graphqlRequest(`
    mutation($data: UserCreateInput!){
      createUser (data: $data) { ${userFields} }
    }`, {
      data: userData
    });

    expect(data.createUser).to.deep.include({
      ...userData,
      lastName: null,
      totp: false,
      isAdmin: false,
      enabled: true,
      personalDiskQuota: '50G',
      groups: []
    });

    // query
    const query = await this.graphqlRequest(`
    query ($where: UserWhereUniqueInput!){
      user(where: $where) { ${userFields} }
    }`, {
      where: {
        id: data.createUser.id
      }
    });

    expect(query.user).to.deep.include(userData);
  });

  it('should add an user with isAdmin = true', async () => {
    const userData = {
      username: faker.internet.userName().toLowerCase(),
      firstName: faker.name.firstName(),
      email: faker.internet.email().toLowerCase(),
      isAdmin: true
    };
    const data = await this.graphqlRequest(`
    mutation($data: UserCreateInput!){
      createUser (data: $data) { ${userFields} }
    }`, {
      data: userData
    });

    expect(data.createUser).to.deep.include({
      ...userData,
      lastName: null,
      totp: false,
      enabled: true,
      groups: []
    });

    // query
    const query = await this.graphqlRequest(`
    query ($where: UserWhereUniqueInput!){
      user(where: $where) { ${userFields} }
    }`, {
      where: {
        id: data.createUser.id
      }
    });

    expect(query.user).to.deep.include(userData);
  });

  it('should get an user', async () => {
    const user = this.currentUser;
    const data = await this.graphqlRequest(`
    query ($where: UserWhereUniqueInput!){
      user(where: $where) { ${userFields} }
    }`, {
      where: {
        id: user.id
      }
    });

    expect(data.user).to.deep.include(user);
  });

  it('should query users with where', async () => {
    const user = this.currentUser;
    const data = await this.graphqlRequest(`
    query ($where: UserWhereInput!){
      users(where: $where) { ${userFields} }
    }`, {
      where: {
        id: user.id
      }
    });

    expect(data.users[0]).to.deep.include(user);
  });

  it('should update an user', async () => {
    const user = this.currentUser;
    const updateData = {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName()
    };
    await this.graphqlRequest(`
    mutation ($where: UserWhereUniqueInput!, $data: UserUpdateInput!){
      updateUser(where: $where, data: $data) { ${userFields} }
    }`, {
      where: {
        id: user.id
      },
      data: updateData
    });

    // currently, I didn't pass the updated data in update mutatoin
    // todo: return udpated data if necessary
    // expect(data.updateUser).to.deep.include(updateData);

    // query
    const query = await this.graphqlRequest(`
    query ($where: UserWhereUniqueInput!){
      user(where: $where) { ${userFields} }
    }`, {
      where: {
        id: user.id
      }
    });

    expect(query.user).to.deep.include(updateData);
  });

  it('should update an user with isAdmin', async () => {
    const user = this.currentUser;
    await this.graphqlRequest(`
    mutation ($where: UserWhereUniqueInput!, $data: UserUpdateInput!){
      updateUser(where: $where, data: $data) { ${userFields} }
    }`, {
      where: {
        id: user.id
      },
      data: {isAdmin: true}
    });
    // query
    const query = await this.graphqlRequest(`
    query ($where: UserWhereUniqueInput!){
      user(where: $where) { ${userFields} }
    }`, {
      where: {
        id: user.id
      }
    });

    expect(query.user.isAdmin).to.be.equals(true);

    // update back to false
    await this.graphqlRequest(`
    mutation ($where: UserWhereUniqueInput!, $data: UserUpdateInput!){
      updateUser(where: $where, data: $data) { ${userFields} }
    }`, {
      where: {
        id: user.id
      },
      data: {isAdmin: false}
    });
    const backQuery = await this.graphqlRequest(`
    query ($where: UserWhereUniqueInput!){
      user(where: $where) { ${userFields} }
    }`, {
      where: {
        id: user.id
      }
    });

    expect(backQuery.user.isAdmin).to.be.equals(false);
  });

  it('should update an user with personalDiskQuota', async () => {
    const user = this.currentUser;
    await this.graphqlRequest(`
    mutation ($where: UserWhereUniqueInput!, $data: UserUpdateInput!){
      updateUser(where: $where, data: $data) { ${userFields} }
    }`, {
      where: {
        id: user.id
      },
      data: {personalDiskQuota: '30G'}
    });
    // query
    const query = await this.graphqlRequest(`
    query ($where: UserWhereUniqueInput!){
      user(where: $where) { ${userFields} }
    }`, {
      where: {
        id: user.id
      }
    });

    expect(query.user.personalDiskQuota).to.be.equals('30G');

    // update back to false
    await this.graphqlRequest(`
    mutation ($where: UserWhereUniqueInput!, $data: UserUpdateInput!){
      updateUser(where: $where, data: $data) { ${userFields} }
    }`, {
      where: {
        id: user.id
      },
      data: {personalDiskQuota: '50G'}
    });
    const backQuery = await this.graphqlRequest(`
    query ($where: UserWhereUniqueInput!){
      user(where: $where) { ${userFields} }
    }`, {
      where: {
        id: user.id
      }
    });

    expect(backQuery.user.personalDiskQuota).to.be.equals('50G');
  });

  it('should delete an user', async () => {
    const user = this.currentUser;
    await this.graphqlRequest(`
    mutation ($where: UserWhereUniqueInput!){
      deleteUser(where: $where) { id }
    }`, {
      where: {
        id: user.id
      }
    });

    // query
    const query = await this.graphqlRequest(`
    query ($where: UserWhereUniqueInput!){
      user(where: $where) { ${userFields} }
    }`, {
      where: {
        id: user.id
      }
    });

    expect(query.user).to.be.null;
  });
});
