// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import faker from 'faker';
import CrdClient from '../src/crdClient/crdClientImpl';
import { cleanupPhJobs } from './sandbox';
import { range } from 'lodash';
import BPromise from 'bluebird';

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
  instanceType {
    id
  }
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

describe('phJob graphql', function() {
  before(async () => {
    // setup lambdas
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
      const group = data.createGroup;
      await (global as any).addUserToGroup(group.id, process.env.TEST_USER_ID);
      return group;
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
    expect(data.phJobs.length >= 0).to.be.true;
  });

  it('create phJob to insert artifacts', async () => {
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
      command: `mkdir -p artifacts;date > artifacts/date.txt;date`
    };

    const mutation = await this.graphqlRequest(`
    mutation($data: PhJobCreateInput!){
      createPhJob (data: $data) { ${fields} }
    }`, {
      data
    });

    const expectedResult = {
      ...data,
      instanceType: {
        id: instanceTypeId
      }
    };

    expect(mutation.createPhJob).to.be.deep.include(expectedResult);
    await BPromise.delay(1000);

    // get one
    const queryOne = await this.graphqlRequest(`
    query($where: PhJobWhereUniqueInput!){
      phJob (where: $where) { ${fields} }
    }`, {
      where: {id: mutation.createPhJob.id}
    });

    expect(queryOne.phJob).to.be.deep.include(expectedResult);
    expect(queryOne.phJob.id).to.exist;
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
      command: `/bin/bash\n-c "echo hello"`
    };
    const mutation = await this.graphqlRequest(`
    mutation($data: PhJobCreateInput!){
      createPhJob (data: $data) { ${fields} }
    }`, {
      data
    });

    const expectedResult = {
      ...data,
      instanceType: {
        id: instanceTypeId
      }
    };
    expect(mutation.createPhJob).to.be.deep.include(expectedResult);
    await BPromise.delay(1000);

    // get one
    const queryOne = await this.graphqlRequest(`
    query($where: PhJobWhereUniqueInput!){
      phJob (where: $where) { ${fields} }
    }`, {
      where: {id: mutation.createPhJob.id}
    });

    expect(queryOne.phJob).to.be.deep.include(expectedResult);
    expect(queryOne.phJob.id).to.exist;
  });

  it('should query large amount of phJob within acceptable time', async () => {
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
      command: `/bin/bash\n-c "echo hello"`
    };

    // do it in serial, so we don't crush the dev env
    await BPromise.each(
      range(500),
      async i => {
        return BPromise.delay(100)
        .then(() => {
          return this.graphqlRequest(`
          mutation($data: PhJobCreateInput!){
            createPhJob (data: $data) { ${fields} }
          }`, {
            data
          });
        });
      }
    );

    // query first page of phJob
    const startTime = Date.now();
    const query = await this.graphqlRequest(`
    query {
      phJobsConnection(first: 10, where: {groupId_in: ["${group.id}"]}) { edges { node {${fields}}} }
    }`);
    expect(query.phJobsConnection.edges.length).to.be.equal(10);

    // should respond in 1 sec
    const duration = Date.now() - startTime;
    expect(duration).to.be.lessThan(1000);
  });
});
