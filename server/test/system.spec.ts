// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import { Server } from 'http';
import { createSandbox, destroySandbox } from './sandbox';
chai.use(chaiHttp);

// import app
import { createApp } from '../src/app';

const expect = chai.expect;

declare module 'mocha' {
  // tslint:disable-next-line:interface-name
  interface ISuiteCallbackContext {
    server?: Server;
    graphqlRequest?: (query: string, variables?: any) => Promise<any>;
  }
}

describe('system graphql', function() {
  before(async () => {
    // setup testing realm and related env
    await createSandbox();

    // create app
    const PORT = 3000;
    const {app, server} = await createApp();
    this.server = app.listen(PORT);
    this.graphqlRequest = async (query, variables) => {
      const res = await chai.request(this.server)
        .post(server.graphqlPath)
        .send({
          operationName: null,
          query,
          variables
        });

      if (res.body && res.body.errors) {
        console.log(JSON.stringify(res.body.errors, null, 2));
      }
      expect(res).to.have.status(200);
      return res.body.data;
    };
  });

  after(async () => {
    await destroySandbox();
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
});
