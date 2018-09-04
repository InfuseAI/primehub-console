// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import faker from 'faker';

chai.use(chaiHttp);

const expect = chai.expect;

// interface
declare module 'mocha' {
  // tslint:disable-next-line:interface-name
  interface ISuiteCallbackContext {
    graphqlRequest?: (query: string, variables?: any) => Promise<any>;
    currentGroup?: any;
    createUser?: any;
    createGroup?: any;
  }
}

describe('group user relation graphql', function() {
  before(async () => {
    this.graphqlRequest = (global as any).graphqlRequest;
    this.createUser = async () => {
      const data = await this.graphqlRequest(`
      mutation($data: UserCreateInput!){
        createUser (data: $data) { id username }
      }`, {
        data: {
          username: faker.internet.userName().toLowerCase(),
          email: faker.internet.email().toLowerCase()
        }
      });
      return data.createUser;
    };

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

  it('should create a group with users', async () => {
    const user = await this.createUser();
    const groupData = {
      name: faker.internet.userName().toLowerCase(),
      users: {connect: [{id: user.id}]}
    };
    const data = await this.graphqlRequest(`
    mutation($data: GroupCreateInput!){
      createGroup (data: $data) { id name users {id} }
    }`, {
      data: groupData
    });

    expect(data.createGroup).to.be.deep.include({
      name: groupData.name,
      users: [{
        id: user.id
      }]
    });

    // query
    const group = data.createGroup;
    const query = await this.graphqlRequest(`
    query($where: GroupWhereUniqueInput!){
      group (where: $where) { id name users {id} }
    }`, {
      where: {id: group.id}
    });
    expect(query.group.users[0]).to.be.eql({
      id: user.id
    });
  });

  it('should create a group, then update with connect', async () => {
    const data = await this.graphqlRequest(`
    mutation($data: GroupCreateInput!){
      createGroup (data: $data) { id name users {id} }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase()
      }
    });

    // update
    const group = data.createGroup;
    const user = await this.createUser();
    await this.graphqlRequest(`
    mutation($where: GroupWhereUniqueInput!, $data: GroupUpdateInput!){
      updateGroup (where: $where, data: $data) { id name users {id} }
    }`, {
      where: {id: group.id},
      data: {
        users: {connect: [{id: user.id}]}
      }
    });

    // query
    const query = await this.graphqlRequest(`
    query($where: GroupWhereUniqueInput!){
      group (where: $where) { id name users {id} }
    }`, {
      where: {id: group.id}
    });
    expect(query.group.users[0]).to.be.eql({
      id: user.id
    });
  });

  it('should create a group with users, then update with connect/disconnect', async () => {
    const firstUser = await this.createUser();
    const data = await this.graphqlRequest(`
    mutation($data: GroupCreateInput!){
      createGroup (data: $data) { id name users {id} }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase(),
        users: {
          connect: [{id: firstUser.id}]
        }
      }
    });

    // update
    const group = data.createGroup;
    const secUser = await this.createUser();
    await this.graphqlRequest(`
    mutation($where: GroupWhereUniqueInput!, $data: GroupUpdateInput!){
      updateGroup (where: $where, data: $data) { id name users {id} }
    }`, {
      where: {id: group.id},
      data: {
        users: {
          connect: [{id: secUser.id}],
          disconnect: [{id: firstUser.id}]
        }
      }
    });

    // query
    const query = await this.graphqlRequest(`
    query($where: GroupWhereUniqueInput!){
      group (where: $where) { id name users {id} }
    }`, {
      where: {id: group.id}
    });
    expect(query.group.users.length).to.be.equals(1);
    expect(query.group.users[0].id).to.be.equals(secUser.id);
  });

  /**
   * user
   */
  it('should create a user with groups', async () => {
    const group = await this.createGroup();
    const userData = {
      username: faker.internet.userName().toLowerCase(),
      email: faker.internet.email(),
      groups: {connect: [{id: group.id}]}
    };
    const data = await this.graphqlRequest(`
    mutation($data: UserCreateInput!){
      createUser (data: $data) { id groups {id} }
    }`, {
      data: userData
    });

    expect(data.createUser).to.be.deep.include({
      groups: [{
        id: group.id
      }]
    });

    // query
    const user = data.createUser;
    const query = await this.graphqlRequest(`
    query($where: UserWhereUniqueInput!){
      user (where: $where) { id groups {id} }
    }`, {
      where: {id: user.id}
    });
    expect(query.user.groups[0]).to.be.eql({
      id: group.id
    });
  });

  it('should create a user, then update with connect', async () => {
    const data = await this.graphqlRequest(`
    mutation($data: UserCreateInput!){
      createUser (data: $data) { id groups {id} }
    }`, {
      data: {
        username: faker.internet.userName().toLowerCase(),
        email: faker.internet.email()
      }
    });

    // update
    const user = data.createUser;
    const group = await this.createGroup();
    await this.graphqlRequest(`
    mutation($where: UserWhereUniqueInput!, $data: UserUpdateInput!){
      updateUser (where: $where, data: $data) { id groups {id} }
    }`, {
      where: {id: user.id},
      data: {
        groups: {connect: [{id: group.id}]}
      }
    });

    // query
    const query = await this.graphqlRequest(`
    query($where: UserWhereUniqueInput!){
      user (where: $where) { id groups {id} }
    }`, {
      where: {id: user.id}
    });
    expect(query.user.groups[0]).to.be.eql({
      id: group.id
    });
  });

  it('should create a user with groups, then update with connect/disconnect', async () => {
    const firstGroup = await this.createGroup();
    const data = await this.graphqlRequest(`
    mutation($data: UserCreateInput!){
      createUser (data: $data) { id groups {id} }
    }`, {
      data: {
        username: faker.internet.userName().toLowerCase(),
        email: faker.internet.email(),
        groups: {
          connect: [{id: firstGroup.id}]
        }
      }
    });

    // update
    const user = data.createUser;
    const secGroup = await this.createGroup();
    await this.graphqlRequest(`
    mutation($where: UserWhereUniqueInput!, $data: UserUpdateInput!){
      updateUser (where: $where, data: $data) { id groups {id} }
    }`, {
      where: {id: user.id},
      data: {
        groups: {
          connect: [{id: secGroup.id}],
          disconnect: [{id: firstGroup.id}]
        }
      }
    });

    // query
    const query = await this.graphqlRequest(`
    query($where: UserWhereUniqueInput!){
      user (where: $where) { id groups {id} }
    }`, {
      where: {id: user.id}
    });
    expect(query.user.groups.length).to.be.equals(1);
    expect(query.user.groups[0].id).to.be.equals(secGroup.id);
  });
});
