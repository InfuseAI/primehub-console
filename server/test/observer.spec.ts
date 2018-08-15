import chai from 'chai';
import chaiHttp = require('chai-http');

chai.use(chaiHttp);

const expect = chai.expect;

import Observer from '../src/observer/observer';
import CrdClient from '../src/crdClient/crdClientImpl';
import faker from 'faker';

declare module 'mocha' {
  // tslint:disable-next-line:interface-name
  interface ISuiteCallbackContext {
    graphqlRequest?: (query: string, variables?: any) => Promise<any>;
    crdClient: CrdClient;
  }
}

describe('observer', function() {
  before(() => {
    this.crdClient = (global as any).crdClient;
    this.graphqlRequest = (global as any).graphqlRequest;
  });

  it('should observe', async () => {
    const observer = new Observer(this.crdClient);
    observer.watch();

    const data = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-')
    };
    const mutation = await this.graphqlRequest(`
    mutation($data: DatasetCreateInput!){
      createDataset (data: $data) { id }
    }`, {
      data
    });
    console.log(mutation);
  });
});
