// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import KeycloakAdminClient from 'keycloak-admin';

chai.use(chaiHttp);

const expect = chai.expect;

declare module 'mocha' {
  // tslint:disable-next-line:interface-name
  interface ISuiteCallbackContext {
    graphqlRequest?: (query: string, variables?: any) => Promise<any>;
    kcAdminClient?: KeycloakAdminClient;
  }
}

describe('system graphql', function() {
  before(() => {
    this.graphqlRequest = (global as any).graphqlRequest;
    this.kcAdminClient = (global as any).kcAdminClient;
  });

  it('should query', async () => {
    const data = await this.graphqlRequest(`{
      system {
        org {
          name
          logo {
            contentType
            name
            size
            url
          }
        },
        defaultUserDiskQuota
      }
    }`);

    expect(data).to.be.eql({
      system: {
        org: {
          name: 'infuse ai',
          logo: null
        },
        defaultUserDiskQuota: 20
      }
    });
  });

  it('should get user personalDiskQuota from default value', async () => {
    const query = await this.graphqlRequest(`
    query {
      users { id personalDiskQuota}
    }`);

    expect(query.users[0].personalDiskQuota).to.be.equals(20);
  });

  it('should mutate', async () => {
    const delta = {
      org: {
        name: 'wwwy3y3',
        logo: {
          url: 'test'
        }
      },
      defaultUserDiskQuota: 30
    };
    const data = await this.graphqlRequest(`
    mutation($data: SystemUpdateInput!){
      updateSystem (data: $data) {
        org {
          name,
          logo {
            url
          }
        }
        defaultUserDiskQuota
      }
    }`, {
      data: delta
    });
    expect(data).to.be.eql({
      updateSystem: delta
    });

    // query again
    const queryData = await this.graphqlRequest(`{
      system {
        org {
          name
          logo {
            contentType
            name
            size
            url
          }
        },
        defaultUserDiskQuota
      }
    }`);

    expect(queryData).to.be.eql({
      system: {
        org: {
          name: delta.org.name,
          logo: {
            contentType: null,
            name: null,
            size: null,
            url: delta.org.logo.url
          }
        },
        defaultUserDiskQuota: delta.defaultUserDiskQuota
      }
    });

    // check in keycloak
    const group = await this.kcAdminClient.groups.findOne({
      realm: process.env.KC_REALM, id: process.env.KC_EVERYONE_GROUP_ID
    });
    expect(group.attributes.defaultUserDiskQuota[0]).to.be.equals(`${delta.defaultUserDiskQuota}G`);
    // should update to realm
    const realm = await this.kcAdminClient.realms.findOne({
      realm: process.env.KC_REALM
    });
    expect(realm.displayName).to.be.equals(delta.org.name);
    // tslint:disable-next-line:max-line-length
    expect(realm.displayNameHtml).to.be.equals(`<img src="${delta.org.logo.url}" alt="${delta.org.name}" width="500" >`);
  });

  it('should mutate again', async () => {
    const delta = {
      org: {
        name: 'wwwy3y3y3',
        logo: {
          url: 'testtest',
          contentType: 'test',
        }
      },
      defaultUserDiskQuota: 20
    };
    const data = await this.graphqlRequest(`
    mutation($data: SystemUpdateInput!){
      updateSystem (data: $data) {
        org {
          name,
          logo {
            url
            contentType
          }
        }
        defaultUserDiskQuota
      }
    }`, {
      data: delta
    });
    expect(data).to.be.eql({
      updateSystem: delta
    });

    // query again
    const queryData = await this.graphqlRequest(`{
      system {
        org {
          name
          logo {
            contentType
            name
            size
            url
          }
        },
        defaultUserDiskQuota
      }
    }`);

    expect(queryData).to.be.eql({
      system: {
        org: {
          name: delta.org.name,
          logo: {
            contentType: delta.org.logo.contentType,
            name: null,
            size: null,
            url: delta.org.logo.url
          }
        },
        defaultUserDiskQuota: delta.defaultUserDiskQuota
      }
    });

    // check in keycloak
    const group = await this.kcAdminClient.groups.findOne({
      realm: process.env.KC_REALM, id: process.env.KC_EVERYONE_GROUP_ID
    });
    expect(group.attributes.defaultUserDiskQuota[0]).to.be.equals(`${delta.defaultUserDiskQuota}G`);
  });
});
