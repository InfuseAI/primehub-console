// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import faker = require('faker');
import KeycloakAdminClient from 'keycloak-admin';
import { setConfigOverwrite } from '../src/config';
import { ErrorCodes } from '../src/errorCodes';

chai.use(chaiHttp);

const expect = chai.expect;

declare module 'mocha' {
  // tslint:disable-next-line:interface-name
  interface ISuiteCallbackContext {
    graphqlRequest?: (query: string, variables?: any) => Promise<any>;
    kcAdminClient?: KeycloakAdminClient;
  }
}

describe('license graphql', function() {
  before(async () => {
    this.graphqlRequest = (global as any).graphqlRequest;
    this.kcAdminClient = (global as any).kcAdminClient;
    this.currentGroup = (global as any).currentGroup;
    await (global as any).authKcAdmin();
  });

  afterEach(async () => {
    setConfigOverwrite();
  });

  it('should query license', async () => {
    const license = {
      licensedTo: 'test',
      licenseStatus: 'expired',
      startedAt: 'start',
      expiredAt: 'expired',
      maxUser: 1,
      maxGroup: 5,
      maxNode: 6,
      maxModelDeploy: 7,
    };
    setConfigOverwrite(license);
    const data = await this.graphqlRequest(`
    fragment licenseData on License {
      licensedTo
      licenseStatus
      startedAt
      expiredAt
      maxUser
      maxGroup
      maxNode
      maxModelDeploy
    }

    query GetLicense {
      license {
        ...licenseData
      }
      system {
        license {
          ...licenseData
        }
      }
    }`);

    expect(data.license).to.be.eql(license);
    expect(data.system.license).to.be.eql(license);
  });

  it('should query license usage', async () => {
    const data = await this.graphqlRequest(`query GetLicense {
      system {
        license {
          usage {
            maxUser
            maxGroup
            maxNode
            maxModelDeploy
          }
        }
      }
    }`);

    const { maxUser, maxGroup, maxNode, maxModelDeploy } = data.system.license.usage;
    expect(maxUser, 'maxUser').to.be.greaterThan(0);
    expect(maxGroup, 'maxGroup').to.be.greaterThan(0);
    expect(maxNode, 'maxNode').to.be.greaterThan(0);
    expect(maxModelDeploy, 'maxModelDpeloy').to.be.equal(0);
  });

  it('should create user failed if user quota exceeded', async () => {
    setConfigOverwrite({ maxUser: 0 });
    const userData = {
      username: faker.internet.userName().toLowerCase(),
    };
    const errors = await this.graphqlRequest(`
      mutation($data: UserCreateInput!){
        createUser (data: $data) { id }
      }
    `,
      { data: userData }
    );

    expect(errors[0]?.extensions?.code).to.be.equal(
      ErrorCodes.EXCEED_QUOTA_ERROR
    );
  });

  it('should create invite failed if user quota exceeded', async () => {
    setConfigOverwrite({ maxUser: 0 });
    const inviteData = {
      groupId: this.currentGroup.id,
    };

    const errors = await this.graphqlRequest(`
      mutation CreateInvitation($data: InvitationCreateInput!) {
        createInvitation(data: $data) {
          invitationToken
        }
      }
    `,
      { data: inviteData }
    );
    expect(errors[0]?.extensions?.code).to.be.equal(
      ErrorCodes.EXCEED_QUOTA_ERROR
    );
  });

  it('should create user from invitatiojn failed if user quota exceeded', async () => {
    const inviteData = {
      groupId: this.currentGroup.id,
    };

    // create invitation
    const data = await this.graphqlRequest(`
      mutation CreateInvitation($data: InvitationCreateInput!) {
        createInvitation(data: $data) {
          invitationToken
        }
      }
    `,
      { data: inviteData }
    );

    const {
      createInvitation: { invitationToken },
    } = data;

    expect(invitationToken).to.be.not.null;

    // create user from invitation
    setConfigOverwrite({ maxUser: 0 });
    const userData = {
      invitationToken,
      username: faker.internet.userName().toLowerCase(),
    };
    const errors = await this.graphqlRequest(`
      mutation CreateUserFromInvitation($data: InvitationApplyInput!) {
        createUserFromInvitation(data: $data) {
          username
          password
        }
      }
    `,
      { data: userData }
    );
    expect(errors[0]?.extensions?.code).to.be.equal(
      ErrorCodes.EXCEED_QUOTA_ERROR
    );
  });

  it('should limit group usage', async () => {
    setConfigOverwrite({ maxGroup: 0 });
    const groupData = {
      name: faker.internet.userName().toLowerCase(),
    };
    const errors = await this.graphqlRequest(`
      mutation($data: GroupCreateInput!){
        createGroup (data: $data) { id }
      }
    `,
      { data: groupData }
    );

    expect(errors[0].extensions.code).to.be.equal(
      ErrorCodes.EXCEED_QUOTA_ERROR
    );
  });
});
