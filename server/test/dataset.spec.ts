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
    currentDataset?: any;
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
    this.currentDataset = queryOne.dataset;
  });

  it('create a dataset with props', async () => {
    const data = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      access: 'private',
      type: 'git',
      url: faker.internet.url()
    };
    const mutation = await this.graphqlRequest(`
    mutation($data: DatasetCreateInput!){
      createDataset (data: $data) { ${fields} }
    }`, {
      data
    });

    expect(mutation.createDataset).to.be.eql({
      id: data.name,
      groups: [],
      ...data
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
      groups: [],
      ...data
    });
  });

  it('should query with where', async () => {
    const queryOne = await this.graphqlRequest(`
    query($where: DatasetWhereUniqueInput!){
      dataset (where: $where) { ${fields} }
    }`, {
      where: {id: this.currentDataset.id}
    });

    expect(queryOne.dataset).to.be.eql(this.currentDataset);
  });

  it('should create with name-only and update', async () => {
    const createMutation = await this.graphqlRequest(`
    mutation($data: DatasetCreateInput!){
      createDataset (data: $data) { ${fields} }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-')
      }
    });

    // update
    const dataset = createMutation.createDataset;
    const data = {
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      access: 'private',
      type: 'git',
      url: faker.internet.url()
    };
    const mutation = await this.graphqlRequest(`
    mutation($where: DatasetWhereUniqueInput!, $data: DatasetUpdateInput!){
      updateDataset (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: dataset.id},
      data
    });

    expect(mutation.updateDataset).to.deep.include(data);

    // query one
    const queryOne = await this.graphqlRequest(`
    query($where: DatasetWhereUniqueInput!){
      dataset (where: $where) { ${fields} }
    }`, {
      where: {id: dataset.id}
    });

    expect(queryOne.dataset).to.deep.include(data);
  });

  it('should create with props and update', async () => {
    const createMutation = await this.graphqlRequest(`
    mutation($data: DatasetCreateInput!){
      createDataset (data: $data) { ${fields} }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
        displayName: faker.internet.userName(),
        description: faker.lorem.sentence(),
        access: 'private',
        type: 'git',
        url: faker.internet.url()
      }
    });

    // update
    const dataset = createMutation.createDataset;
    const data = {
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      access: 'private',
      type: 'git',
      url: faker.internet.url()
    };
    const mutation = await this.graphqlRequest(`
    mutation($where: DatasetWhereUniqueInput!, $data: DatasetUpdateInput!){
      updateDataset (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: dataset.id},
      data
    });

    expect(mutation.updateDataset).to.deep.include(data);

    // query one
    const queryOne = await this.graphqlRequest(`
    query($where: DatasetWhereUniqueInput!){
      dataset (where: $where) { ${fields} }
    }`, {
      where: {id: dataset.id}
    });

    expect(queryOne.dataset).to.deep.include(data);
  });

  it('should delete dataset', async () => {
    const mutation = await this.graphqlRequest(`
    mutation($where: DatasetWhereUniqueInput!){
      deleteDataset (where: $where) { id }
    }`, {
      where: {id: this.currentDataset.id}
    });

    // query
    const data = await this.graphqlRequest(`
    query ($where: DatasetWhereUniqueInput!) {
      dataset (where: $where) { ${fields} }
    }`, {
      where: {id: this.currentDataset.id}
    });

    expect(data.dataset).to.be.null;
  });
});
