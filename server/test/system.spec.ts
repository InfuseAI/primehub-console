// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');

chai.use(chaiHttp);

const expect = chai.expect;

declare module 'mocha' {
  // tslint:disable-next-line:interface-name
  interface ISuiteCallbackContext {
    graphqlRequest?: (query: string, variables?: any) => Promise<any>;
  }
}

describe('system graphql', function() {
  before(() => {
    this.graphqlRequest = (global as any).graphqlRequest;
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
        defaultUserDiskQuota: '20G'
      }
    });
  });

  it('should mutate', async () => {
    const delta = {
      org: {
        name: 'wwwy3y3',
        logo: {
          url: 'test'
        }
      },
      defaultUserDiskQuota: '30G'
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
      defaultUserDiskQuota: '20G'
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
  });
});
