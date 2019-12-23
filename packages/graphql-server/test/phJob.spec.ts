// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import faker from 'faker';
import CrdClient from '../src/crdClient/crdClientImpl';
import { cleanupPhJobs } from './sandbox';
import { pickBy, isUndefined } from 'lodash';
import { stringifyMemory } from '../src/resolvers/utils';

chai.use(chaiHttp);

const expect = chai.expect;

// utils
const fields = `
  id
  displayName
  cancel
  command
  groupId
  groupName
  image
  instanceType
  userId
  userName
  phase
  reason
  createTime
  startTime
  finishTime
  logEndpoint
`;

declare module 'mocha' {
  // tslint:disable-next-line:interface-name
  interface ISuiteCallbackContext {
    graphqlRequest?: (query: string, variables?: any) => Promise<any>;
    crdClient: CrdClient;
    createGroup?: any;
    currentPhJob?: any;
  }
}

describe('instanceType graphql', function() {
  before(async () => {
    this.graphqlRequest = (global as any).graphqlRequest;
    this.crdClient = (global as any).crdClient;
    this.createGroup = async () => {
      const data = await this.graphqlRequest(`
      mutation($data: GroupCreateInput!){
        createGroup (data: $data) { id name }
      }`, {
        data: {
          name: faker.internet.userName().toLowerCase()
        }
      });
      return data.createGroup;
    };
    await (global as any).authKcAdmin();
  });

  after(async () => {
    await cleanupPhJobs();
  });

  it('query phJobs', async () => {
    const data = await this.graphqlRequest(`{
      phJobs {${fields}}
    }`);
    expect(data.phJobs).to.be.eql([]);
  });

  it('create phJob', async () => {
    const group = await this.createGroup();
    const instanceTypeId = faker.internet.userName().toLowerCase().replace(/_/g, '-');
    const imageId = faker.internet.userName().toLowerCase().replace(/_/g, '-');
    // create instanceType
    await this.graphqlRequest(`
    mutation($data: InstanceTypeCreateInput!){
      createInstanceType (data: $data) { id }
    }`, {
      data: {
        name: instanceTypeId,
        cpuLimit: 2,
        memoryLimit: 2,
        cpuRequest: 2,
        memoryRequest: 2,
        groups: {
          connect: [{id: group.id}]
        }
      }
    });
    // create image
    await this.graphqlRequest(`
    mutation($data: ImageCreateInput!){
      createImage (data: $data) { id }
    }`, {
      data: {
        name: imageId,
        groups: {
          connect: [{id: group.id}]
        }
      }
    });

    const data = {
      displayName: 'job name',
      groupId: group.id,
      instanceType: instanceTypeId,
      image: imageId,
      command: '/bin/bash -c "echo hello"'
    };
    const mutation = await this.graphqlRequest(`
    mutation($data: PhJobCreateInput!){
      createPhJob (data: $data) { ${fields} }
    }`, {
      data
    });

    expect(mutation.createPhJob).to.be.include(data);

    // get one
    const queryOne = await this.graphqlRequest(`
    query($where: PhJobWhereUniqueInput!){
      phJob (where: $where) { ${fields} }
    }`, {
      where: {id: mutation.createPhJob.id}
    });

    expect(queryOne.phJob).to.be.include(data);
    expect(queryOne.phJob.id).to.exist;

    this.currentPhJob = queryOne.phJob;
  });
});
