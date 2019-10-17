// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import faker from 'faker';
import CrdClient from '../src/crdClient/crdClientImpl';
import { cleanupInstanceTypes } from './sandbox';
import { pickBy, isUndefined } from 'lodash';
import { stringifyMemory } from '../src/resolvers/utils';

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
  spec
  tolerations {
    operator
    effect
    key
    value
  }
  nodeSelector
  groups {
    id
    name
    displayName
    quotaCpu
    quotaGpu
    userVolumeCapacity
  }`;

declare module 'mocha' {
  // tslint:disable-next-line:interface-name
  interface ISuiteCallbackContext {
    graphqlRequest?: (query: string, variables?: any) => Promise<any>;
    crdClient: CrdClient;
    currentInstanceType?: any;
  }
}

const pickSpec = (data: any) => {
  return pickBy({
    'displayName': data.displayName,
    'description': data.description,
    'limits.cpu': data.cpuLimit,
    'limits.memory': data.memoryLimit ? stringifyMemory(data.memoryLimit) : undefined,
    'limits.nvidia.com/gpu': data.gpuLimit,
    'requests.cpu': data.cpuRequest,
    'requests.memory': data.memoryRequest ? stringifyMemory(data.memoryRequest) : undefined
  }, e => !isUndefined(e));
};

describe('instanceType graphql', function() {
  before(async () => {
    this.graphqlRequest = (global as any).graphqlRequest;
    this.crdClient = (global as any).crdClient;
    await (global as any).authKcAdmin();
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

  it('create a instanceType with only required fields', async () => {
    const data = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      cpuLimit: 2,
      memoryLimit: 2
    };
    const mutation = await this.graphqlRequest(`
    mutation($data: InstanceTypeCreateInput!){
      createInstanceType (data: $data) { ${fields} }
    }`, {
      data
    });

    expect(mutation.createInstanceType).to.be.eql({
      ...data,
      id: data.name,
      name: data.name,
      displayName: data.name,
      description: null,
      cpuRequest: null,
      memoryRequest: null,
      nodeSelector: null,
      tolerations: [],
      gpuLimit: 0,
      global: false,
      spec: pickSpec({
        ...data,
        displayName: data.name
      }),
      groups: [],
    });

    // get one
    const queryOne = await this.graphqlRequest(`
    query($where: InstanceTypeWhereUniqueInput!){
      instanceType (where: $where) { ${fields} }
    }`, {
      where: {id: data.name}
    });

    expect(queryOne.instanceType).to.be.eql({
      ...data,
      id: data.name,
      name: data.name,
      displayName: data.name,
      description: null,
      cpuRequest: null,
      memoryRequest: null,
      nodeSelector: null,
      tolerations: [],
      gpuLimit: 0,
      global: false,
      spec: pickSpec({
        ...data,
        displayName: data.name
      }),
      groups: []
    });

    // check in k8s
    const instanceType = await this.crdClient.instanceTypes.get(data.name);
    expect(instanceType.spec['limits.memory']).to.be.equals('2G');
    expect(instanceType.spec['limits.cpu']).to.be.equals(2);
    expect(instanceType.spec['requests.memory']).to.be.undefined;
    expect(instanceType.spec['requests.cpu']).to.be.undefined;

    this.currentInstanceType = queryOne.instanceType;
  });

  it('create a instanceType with props and global = false', async () => {
    const data = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      cpuLimit: 2.5,
      cpuRequest: 2.5,
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
      spec: pickSpec(data),
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
      spec: pickSpec(data),
      ...data
    });

    // check in k8s
    const instanceType = await this.crdClient.instanceTypes.get(data.name);
    expect(instanceType.spec['limits.memory']).to.be.equals('25G');
    expect(instanceType.spec['requests.memory']).to.be.equals('20G');
  });

  it('create a instanceType with props and global = true', async () => {
    const data = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      cpuLimit: 2.5,
      cpuRequest: 2.5,
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
      spec: pickSpec(data),
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
      spec: pickSpec(data),
      ...data
    });

    // check in k8s
    const instanceType = await this.crdClient.instanceTypes.get(data.name);
    expect(instanceType.spec['limits.memory']).to.be.equals('25G');
    expect(instanceType.spec['requests.memory']).to.be.equals('20G');
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

  it('should create with required fields and update', async () => {
    const createdData = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      cpuLimit: 2,
      memoryLimit: 2,
      cpuRequest: 2,
      memoryRequest: 2
    };
    const createMutation = await this.graphqlRequest(`
    mutation($data: InstanceTypeCreateInput!){
      createInstanceType (data: $data) { ${fields} }
    }`, {
      data: createdData
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

    expect(mutation.updateInstanceType).to.deep.include({...createdData, ...data});

    // query one
    const queryOne = await this.graphqlRequest(`
    query($where: InstanceTypeWhereUniqueInput!){
      instanceType (where: $where) { ${fields} }
    }`, {
      where: {id: instanceType.id}
    });

    expect(queryOne.instanceType).to.deep.include({...createdData, ...data});

    // check in k8s
    const instance = await this.crdClient.instanceTypes.get(instanceType.id);
    expect(instance.spec['limits.memory']).to.be.equals('25G');
    expect(instance.spec['requests.memory']).to.be.equals('20G');
  });

  it('should create with props and update', async () => {
    const createdData = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      cpuLimit: 2.5,
      cpuRequest: 2.5,
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
    expect(instance.spec['limits.memory']).to.be.equals('50G');
    expect(instance.spec['requests.memory']).to.be.equals('50G');
  });

  it('should create with required fields and update global twice', async () => {
    const createMutation = await this.graphqlRequest(`
    mutation($data: InstanceTypeCreateInput!){
      createInstanceType (data: $data) { ${fields} }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
        cpuLimit: 2.5,
        cpuRequest: 2.5,
        memoryLimit: 25,
        memoryRequest: 20
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

  it('should create with required fields and update with tolerations and nodeSelector', async () => {
    const createMutation = await this.graphqlRequest(`
    mutation($data: InstanceTypeCreateInput!){
      createInstanceType (data: $data) { ${fields} }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
        cpuLimit: 2.5,
        cpuRequest: 2.5,
        memoryLimit: 25,
        memoryRequest: 20
      }
    });

    // update
    const instanceType = createMutation.createInstanceType;
    const requestBody = {
      tolerations: {
        set: [{
          operator: 'Exists',
          effect: 'None'
        }, {
          operator: 'Exists',
          effect: 'None',
          key: 'key'
        }]
      },
      nodeSelector: {
        gpu: 'v100'
      }
    };
    const mutation = await this.graphqlRequest(`
    mutation($where: InstanceTypeWhereUniqueInput!, $data: InstanceTypeUpdateInput!){
      updateInstanceType (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: instanceType.id},
      data: requestBody
    });

    // query one
    const queryOne = await this.graphqlRequest(`
    query($where: InstanceTypeWhereUniqueInput!){
      instanceType (where: $where) { ${fields} }
    }`, {
      where: {id: instanceType.id}
    });

    expect(queryOne.instanceType.nodeSelector).to.be.eql(requestBody.nodeSelector);
    expect(queryOne.instanceType.tolerations[0]).to.include(requestBody.tolerations.set[0]);
    expect(queryOne.instanceType.tolerations[1]).to.include(requestBody.tolerations.set[1]);
  });

  it('should create with tolerations and nodeSelector', async () => {
    const requestBody = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      cpuLimit: 2.5,
      cpuRequest: 2.5,
      memoryLimit: 25,
      memoryRequest: 20,
      tolerations: {
        set: [{
          operator: 'Exists',
          effect: 'None'
        }, {
          operator: 'Exists',
          effect: 'None',
          key: 'key'
        }]
      },
      nodeSelector: {
        gpu: 'v100',
        cool: 123
      }
    };
    const createMutation = await this.graphqlRequest(`
    mutation($data: InstanceTypeCreateInput!){
      createInstanceType (data: $data) { ${fields} }
    }`, {
      data: requestBody
    });

    // query one
    const queryOne = await this.graphqlRequest(`
    query($where: InstanceTypeWhereUniqueInput!){
      instanceType (where: $where) { ${fields} }
    }`, {
      where: {id: createMutation.createInstanceType.id}
    });

    expect(queryOne.instanceType.nodeSelector).to.be.eql(requestBody.nodeSelector);
    expect(queryOne.instanceType.tolerations[0]).to.include(requestBody.tolerations.set[0]);
    expect(queryOne.instanceType.tolerations[1]).to.include(requestBody.tolerations.set[1]);
  });

  it('should create with tolerations and nodeSelector and update', async () => {
    const requestBody = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      cpuLimit: 2.5,
      cpuRequest: 2.5,
      memoryLimit: 25,
      memoryRequest: 20,
      tolerations: {
        set: [{
          operator: 'Exists',
          effect: 'None'
        }, {
          operator: 'Exists',
          effect: 'None',
          key: 'key'
        }]
      },
      nodeSelector: {
        gpu: 'v100',
        cool: 123
      }
    };
    const createMutation = await this.graphqlRequest(`
    mutation($data: InstanceTypeCreateInput!){
      createInstanceType (data: $data) { ${fields} }
    }`, {
      data: requestBody
    });

    // update
    const delta = {
      tolerations: {
        set: [{
          operator: 'Exists',
          effect: 'None'
        }, {
          operator: 'Exists',
          effect: 'None',
          key: 'key'
        }, {
          effect: 'NoExecute',
          operator: 'Exists'
        }, {
          effect: 'NoSchedule',
          key: 'clkao',
          operator: 'Equal',
          value: 'handsomeBody'
        }]
      },
      // null indicates remove all
      nodeSelector: null
    };

    const mutation = await this.graphqlRequest(`
    mutation($where: InstanceTypeWhereUniqueInput!, $data: InstanceTypeUpdateInput!){
      updateInstanceType (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: createMutation.createInstanceType.id},
      data: delta
    });

    // query one
    const queryOne = await this.graphqlRequest(`
    query($where: InstanceTypeWhereUniqueInput!){
      instanceType (where: $where) { ${fields} }
    }`, {
      where: {id: createMutation.createInstanceType.id}
    });

    expect(queryOne.instanceType.nodeSelector).to.be.null;
    queryOne.instanceType.tolerations.forEach((toleration, index) => {
      expect(toleration).to.include(delta.tolerations.set[index]);
    });

    // update again
    const deltaAgain = {
      tolerations: {
        set: [{
          key: 'key',
          operator: 'Exists',
          effect: 'None'
        }]
      },
      nodeSelector: {
        key: 'value'
      }
    };
    await this.graphqlRequest(`
    mutation($where: InstanceTypeWhereUniqueInput!, $data: InstanceTypeUpdateInput!){
      updateInstanceType (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: createMutation.createInstanceType.id},
      data: deltaAgain
    });

    // query one
    const queryOneAgain = await this.graphqlRequest(`
    query($where: InstanceTypeWhereUniqueInput!){
      instanceType (where: $where) { ${fields} }
    }`, {
      where: {id: createMutation.createInstanceType.id}
    });

    expect(queryOneAgain.instanceType.nodeSelector).to.be.eql(deltaAgain.nodeSelector);
    queryOneAgain.instanceType.tolerations.forEach((toleration, index) => {
      expect(toleration).to.include(deltaAgain.tolerations.set[index]);
    });

    // update again with different nodeSelector
    const deltaNodeSelector = {
      nodeSelector: {
        key2: 'value2'
      }
    };
    await this.graphqlRequest(`
    mutation($where: InstanceTypeWhereUniqueInput!, $data: InstanceTypeUpdateInput!){
      updateInstanceType (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: createMutation.createInstanceType.id},
      data: deltaNodeSelector
    });

    // query one
    const queryOneAgainSelector = await this.graphqlRequest(`
    query($where: InstanceTypeWhereUniqueInput!){
      instanceType (where: $where) { ${fields} }
    }`, {
      where: {id: createMutation.createInstanceType.id}
    });

    expect(queryOneAgainSelector.instanceType.nodeSelector).to.be.eql(deltaNodeSelector.nodeSelector);
  });

  it('should should throw due to invalid effect value (not being None)', async () => {
    const requestBody = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      cpuLimit: 2.5,
      cpuRequest: 2.5,
      memoryLimit: 25,
      memoryRequest: 20,
      tolerations: {
        set: [{
          operator: 'Exists',
        }]
      }
    };
    const createMutation = await this.graphqlRequest(`
    mutation($data: InstanceTypeCreateInput!){
      createInstanceType (data: $data) { ${fields} }
    }`, {
      data: requestBody
    });
    expect(createMutation[0].extensions.code).to.be.equal('REQUEST_BODY_INVALID');
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

  it('should create with request fields and update with null', async () => {
    const createdData = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      cpuLimit: 2.5,
      cpuRequest: 2.5,
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
      memoryRequest: null,
      cpuRequest: null
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
    expect(instance.spec['limits.memory']).to.be.equals('25G');
    expect(instance.spec['requests.memory']).to.be.undefined;
    expect(instance.spec['limits.cpu']).to.be.equals(2.5);
    expect(instance.spec['requests.cpu']).to.be.undefined;
  });

  it('should create with request fields without values and update with value', async () => {
    const createdData = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      cpuLimit: 2.5,
      gpuLimit: 2,
      memoryLimit: 25,
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
      memoryRequest: 20,
      cpuRequest: 2.5
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
    expect(instance.spec['limits.memory']).to.be.equals('25G');
    expect(instance.spec['requests.memory']).to.be.equals('20G');
    expect(instance.spec['limits.cpu']).to.be.equals(2.5);
    expect(instance.spec['requests.cpu']).to.be.equals(2.5);
  });

  it('should create with request fields and update without change', async () => {
    const createdData = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      cpuLimit: 2.5,
      cpuRequest: 2.5,
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
      description: faker.lorem.sentence(),
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
    expect(instance.spec['limits.memory']).to.be.equals('25G');
    expect(instance.spec['requests.memory']).to.be.equals('20G');
    expect(instance.spec['limits.cpu']).to.be.equals(2.5);
    expect(instance.spec['requests.cpu']).to.be.equals(2.5);
  });
});
