// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import faker from 'faker';
import CrdClient from '../src/crdClient/crdClientImpl';
import { cleanupInstanceTypes } from './sandbox';

chai.use(chaiHttp);

const expect = chai.expect;

// utils
const fields = `
  id
  name
  displayName
  description
  cpuLimit
  memoryLimit
  gpuLimit
  cpuRequest
  memoryRequest
  global
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
    crdClient: CrdClient;
    currentInstanceType?: any;
  }
}

describe('instanceType graphql', function() {
  before(() => {
    this.graphqlRequest = (global as any).graphqlRequest;
    this.crdClient = (global as any).crdClient;
  });

  after(async () => {
    await cleanupInstanceTypes();
  });

  it('query instanceTypes', async () => {
    const data = await this.graphqlRequest(`{
      instanceTypes {${fields}}
    }`);
    expect(data.instanceTypes).to.be.eql([]);
  });

  it('create a instanceType with only name', async () => {
    const data = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-')
    };
    const mutation = await this.graphqlRequest(`
    mutation($data: InstanceTypeCreateInput!){
      createInstanceType (data: $data) { ${fields} }
    }`, {
      data
    });

    expect(mutation.createInstanceType).to.be.eql({
      id: data.name,
      name: data.name,
      displayName: data.name,
      description: null,
      cpuLimit: 0,
      memoryLimit: null,
      gpuLimit: 0,
      cpuRequest: 0,
      memoryRequest: null,
      global: false,
      groups: []
    });

    // get one
    const queryOne = await this.graphqlRequest(`
    query($where: InstanceTypeWhereUniqueInput!){
      instanceType (where: $where) { ${fields} }
    }`, {
      where: {id: data.name}
    });

    expect(queryOne.instanceType).to.be.eql({
      id: data.name,
      name: data.name,
      displayName: data.name,
      description: null,
      cpuLimit: 0,
      memoryLimit: null,
      gpuLimit: 0,
      cpuRequest: 0,
      memoryRequest: null,
      global: false,
      groups: []
    });
    this.currentInstanceType = queryOne.instanceType;
  });

  it('create a instanceType with props and global = false', async () => {
    const data = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      cpuLimit: 2.5,
      gpuLimit: 2,
      memoryLimit: 25,
      memoryRequest: 20,
      global: false
    };
    const mutation = await this.graphqlRequest(`
    mutation($data: InstanceTypeCreateInput!){
      createInstanceType (data: $data) { ${fields} }
    }`, {
      data
    });

    expect(mutation.createInstanceType).to.deep.include({
      id: data.name,
      groups: [],
      ...data
    });

    // get one
    const queryOne = await this.graphqlRequest(`
    query($where: InstanceTypeWhereUniqueInput!){
      instanceType (where: $where) { ${fields} }
    }`, {
      where: {id: data.name}
    });

    expect(queryOne.instanceType).to.deep.include({
      id: data.name,
      groups: [],
      ...data
    });

    // check in k8s
    const instanceType = await this.crdClient.instanceTypes.get(data.name);
    expect(instanceType.spec['limits.memory']).to.be.equals('25M');
    expect(instanceType.spec['requests.memory']).to.be.equals('20M');
  });

  it('create a instanceType with props and global = true', async () => {
    const data = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      cpuLimit: 2.5,
      gpuLimit: 2,
      memoryLimit: 25,
      memoryRequest: 20,
      global: true
    };
    const mutation = await this.graphqlRequest(`
    mutation($data: InstanceTypeCreateInput!){
      createInstanceType (data: $data) { ${fields} }
    }`, {
      data
    });

    expect(mutation.createInstanceType).to.deep.include({
      id: data.name,
      groups: [],
      ...data
    });

    // get one
    const queryOne = await this.graphqlRequest(`
    query($where: InstanceTypeWhereUniqueInput!){
      instanceType (where: $where) { ${fields} }
    }`, {
      where: {id: data.name}
    });

    expect(queryOne.instanceType).to.deep.include({
      id: data.name,
      groups: [],
      ...data
    });

    // check in k8s
    const instanceType = await this.crdClient.instanceTypes.get(data.name);
    expect(instanceType.spec['limits.memory']).to.be.equals('25M');
    expect(instanceType.spec['requests.memory']).to.be.equals('20M');
  });

  it('should query with where', async () => {
    const queryOne = await this.graphqlRequest(`
    query($where: InstanceTypeWhereUniqueInput!){
      instanceType (where: $where) { ${fields} }
    }`, {
      where: {id: this.currentInstanceType.id}
    });

    expect(queryOne.instanceType).to.be.eql(this.currentInstanceType);
  });

  it('should create with name-only and update', async () => {
    const createMutation = await this.graphqlRequest(`
    mutation($data: InstanceTypeCreateInput!){
      createInstanceType (data: $data) { ${fields} }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-')
      }
    });

    // update
    const instanceType = createMutation.createInstanceType;
    const data = {
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      cpuLimit: 2.5,
      gpuLimit: 2,
      memoryLimit: 25,
      memoryRequest: 20
    };
    const mutation = await this.graphqlRequest(`
    mutation($where: InstanceTypeWhereUniqueInput!, $data: InstanceTypeUpdateInput!){
      updateInstanceType (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: instanceType.id},
      data
    });

    expect(mutation.updateInstanceType).to.deep.include(data);

    // query one
    const queryOne = await this.graphqlRequest(`
    query($where: InstanceTypeWhereUniqueInput!){
      instanceType (where: $where) { ${fields} }
    }`, {
      where: {id: instanceType.id}
    });

    expect(queryOne.instanceType).to.deep.include(data);

    // check in k8s
    const instance = await this.crdClient.instanceTypes.get(instanceType.id);
    expect(instance.spec['limits.memory']).to.be.equals('25M');
    expect(instance.spec['requests.memory']).to.be.equals('20M');
  });

  it('should create with props and update', async () => {
    const createdData = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      cpuLimit: 2.5,
      gpuLimit: 2,
      memoryLimit: 25,
      memoryRequest: 20
    };
    const createMutation = await this.graphqlRequest(`
    mutation($data: InstanceTypeCreateInput!){
      createInstanceType (data: $data) { ${fields} }
    }`, {
      data: createdData
    });

    // update
    const instanceType = createMutation.createInstanceType;
    const updatedData = {
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      cpuLimit: 5,
      memoryLimit: 50,
      memoryRequest: 50
    };
    const mutation = await this.graphqlRequest(`
    mutation($where: InstanceTypeWhereUniqueInput!, $data: InstanceTypeUpdateInput!){
      updateInstanceType (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: instanceType.id},
      data: updatedData
    });
    const expectedData = {...createdData, ...updatedData};
    expect(mutation.updateInstanceType).to.deep.include(expectedData);

    // query one
    const queryOne = await this.graphqlRequest(`
    query($where: InstanceTypeWhereUniqueInput!){
      instanceType (where: $where) { ${fields} }
    }`, {
      where: {id: instanceType.id}
    });

    expect(queryOne.instanceType).to.deep.include(expectedData);
    // check in k8s
    const instance = await this.crdClient.instanceTypes.get(instanceType.id);
    expect(instance.spec['limits.memory']).to.be.equals('50M');
    expect(instance.spec['requests.memory']).to.be.equals('50M');
  });

  it('should create with name-only and update global twice', async () => {
    const createMutation = await this.graphqlRequest(`
    mutation($data: InstanceTypeCreateInput!){
      createInstanceType (data: $data) { ${fields} }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-')
      }
    });

    // update
    const instanceType = createMutation.createInstanceType;
    const mutation = await this.graphqlRequest(`
    mutation($where: InstanceTypeWhereUniqueInput!, $data: InstanceTypeUpdateInput!){
      updateInstanceType (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: instanceType.id},
      data: {global: true}
    });

    expect(mutation.updateInstanceType.global).to.be.equals(true);

    // true again
    await this.graphqlRequest(`
    mutation($where: InstanceTypeWhereUniqueInput!, $data: InstanceTypeUpdateInput!){
      updateInstanceType (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: instanceType.id},
      data: {global: true}
    });

    // update again
    const backMutation = await this.graphqlRequest(`
    mutation($where: InstanceTypeWhereUniqueInput!, $data: InstanceTypeUpdateInput!){
      updateInstanceType (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: instanceType.id},
      data: {global: false}
    });

    expect(backMutation.updateInstanceType.global).to.be.equals(false);

    // false again
    await this.graphqlRequest(`
    mutation($where: InstanceTypeWhereUniqueInput!, $data: InstanceTypeUpdateInput!){
      updateInstanceType (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: instanceType.id},
      data: {global: false}
    });

    // query one
    const queryOne = await this.graphqlRequest(`
    query($where: InstanceTypeWhereUniqueInput!){
      instanceType (where: $where) { ${fields} }
    }`, {
      where: {id: instanceType.id}
    });

    expect(queryOne.instanceType.global).to.be.equals(false);
  });

  it('should delete instanceType', async () => {
    const mutation = await this.graphqlRequest(`
    mutation($where: InstanceTypeWhereUniqueInput!){
      deleteInstanceType (where: $where) { id }
    }`, {
      where: {id: this.currentInstanceType.id}
    });

    // query
    const data = await this.graphqlRequest(`
    query ($where: InstanceTypeWhereUniqueInput!) {
      instanceType (where: $where) { ${fields} }
    }`, {
      where: {id: this.currentInstanceType.id}
    });

    expect(data.instanceType).to.be.null;
  });
});
