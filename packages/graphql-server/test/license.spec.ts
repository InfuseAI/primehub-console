// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import KeycloakAdminClient from 'keycloak-admin';
import { overrideLienceseConfig } from '../src/ee/resolvers/license';

chai.use(chaiHttp);

const expect = chai.expect;

declare module 'mocha' {
  // tslint:disable-next-line:interface-name
  interface ISuiteCallbackContext {
    graphqlRequest?: (query: string, variables?: any) => Promise<any>;
    kcAdminClient?: KeycloakAdminClient;
  }
}

const systemFields = `
  license {
    licensedTo
    licenseStatus
    startedAt
    expiredAt
    maxGroup
    maxNode
    maxModelDeploy
    usage {
      maxGroup
      maxNode
      maxModelDeploy
      __typename
    }
    __typename
  }
`;

describe('license graphql', function() {
  before(async () => {
    this.graphqlRequest = (global as any).graphqlRequest;
    this.kcAdminClient = (global as any).kcAdminClient;
    await (global as any).authKcAdmin();
  });

  after(async () => {
    overrideLienceseConfig();
  });

  it('should query liense2', async () => {
    const license = {
      licensedTo: 'test',
      licenseStatus: 'expired',
      startedAt: '',
      expiredAt: '',
      maxGroup: 5,
      maxNode: 6,
      maxModelDeploy: 7,
    };
    overrideLienceseConfig(license);
    const data = await this.graphqlRequest(`query GetLicense {
      system {
        license {
          licensedTo
          licenseStatus
          startedAt
          expiredAt
          maxGroup
          maxNode
          maxModelDeploy
          usage {
            maxGroup
            maxNode
            maxModelDeploy
          }
        }
      }
    }`);

    expect(data).to.be.not.null;
  });
});
