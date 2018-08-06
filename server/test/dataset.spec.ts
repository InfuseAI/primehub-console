// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import faker from 'faker';

chai.use(chaiHttp);

const expect = chai.expect;

// utils
const fields = `
  id
  name
  displayName
  description
  access
  type
  url
  groups {
    id
    name
    displayName
    canUseGpu
    cpuQuota
    gpuQuota
    diskQuota
  }`;

declare module 'mocha' {
  // tslint:disable-next-line:interface-name
  interface ISuiteCallbackContext {
    graphqlRequest?: (query: string, variables?: any) => Promise<any>;
  }
}

describe('dataset graphql', function() {
  before(() => {
    this.graphqlRequest = (global as any).graphqlRequest;
  });

  it('query datasets', async () => {
    const data = await this.graphqlRequest(`{
      datasets {${fields}}
    }`);
    expect(data.datasets).to.be.eql([]);
  });

  it('create a dataset with only name', async () => {
    const data = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-')
    };
    const mutation = await this.graphqlRequest(`
    mutation($data: DatasetCreateInput!){
      createDataset (data: $data) { ${fields} }
    }`, {
      data
    });

    expect(mutation.createDataset).to.be.eql({
      id: data.name,
      name: data.name,
      displayName: data.name,
      description: null,
      access: null,
      type: null,
      url: null,
      groups: []
    });

    // get one
    const queryOne = await this.graphqlRequest(`
    query($where: DatasetWhereUniqueInput!){
      dataset (where: $where) { ${fields} }
    }`, {
      where: {id: data.name}
    });

    expect(queryOne.dataset).to.be.eql({
      id: data.name,
      name: data.name,
      displayName: data.name,
      description: null,
      access: null,
      type: null,
      url: null,
      groups: []
    });
  });
});
