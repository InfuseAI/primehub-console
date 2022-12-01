// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import faker from 'faker';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';

chai.use(chaiHttp);

const expect = chai.expect;

// interface
declare module 'mocha' {
  // tslint:disable-next-line:interface-name
  interface ISuiteCallbackContext {
    graphqlRequest?: (query: string, variables?: any) => Promise<any>;
    kcAdminClient?: KeycloakAdminClient;
    currentGroup?: any;
  }
}

describe('invitation graphql', function() {
  before(async () => {
    this.graphqlRequest = (global as any).graphqlRequest;
    this.kcAdminClient = (global as any).kcAdminClient;
    await (global as any).authKcAdmin();
    this.groupData = (await createGroup(this.graphqlRequest)).createGroup;
  });

  it('generate invitation and create user from the invitation', async () => {
    // generate invitation
    const variables = {
      data: { groupId: this.groupData.id },
    };
    const data = await this.graphqlRequest(
      `
    mutation($data: InvitationCreateInput!) {
      createInvitation(data:$data){
        invitationToken
      }
    }
    `,
      variables
    );
    expect(data.createInvitation.invitationToken).to.not.empty;

    // apply invitation
    const username = faker.internet.userName().toLowerCase();
    const applyInvitationVars = {
      data: {
        invitationToken: data.createInvitation.invitationToken,
        username,
      },
    };

    const appliedData = await this.graphqlRequest(
      `
    mutation($data: InvitationApplyInput!) {
      createUserFromInvitation(data:$data){
        username
        password
      }
    }
    `,
      applyInvitationVars
    );

    // check user created and join the group
    const usersData = await this.graphqlRequest(`
    query {
      users { id, username
        groups {
          id
          name
        }
      }
    }
    `);
    console.log(appliedData);
    console.log(usersData);

    const createdUser = usersData.users.filter(
      t => t.username === appliedData.createUserFromInvitation.username
    );
    expect(createdUser.length).to.be.equal(1);

    // check the joined group
    expect(createdUser[0].groups[0].id).to.be.equal(this.groupData.id);
    expect(createdUser[0].groups[0].name).to.be.equal(this.groupData.name);

    // check the token has been revoke
    const queryStatusVar = {
      data: { invitationToken: applyInvitationVars.data.invitationToken },
    };
    const invitationTokenStatus = await this.graphqlRequest(
      `
    query queryInvitaion($data: InvitationQueryInput!) {
      invitation(data: $data) {
        validation
      }
    }`,
      queryStatusVar
    );

    expect('INVALID_TOKEN').to.be.equals(invitationTokenStatus[0].message);
  });

  async function createGroup(graphqlRequest) {
    const groupData = {
      name: faker.internet.userName().toLowerCase(),
    };
    const data = await graphqlRequest(
      `
      mutation($data: GroupCreateInput!){
        createGroup (data: $data) { id name }
      }`,
      {
        data: groupData,
      }
    );
    return data;
  }
});
