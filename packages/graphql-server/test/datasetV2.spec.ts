// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import faker from 'faker';
import moment = require('moment');
import { Client } from 'minio';

chai.use(chaiHttp);

const expect = chai.expect;
const BUCKET_NAME = 'test';
const GROUP_NAME = 'test';

describe('dataset v2 graphql', function() {
  before(async () => {
    this.graphqlRequest = (global as any).graphqlRequest;
    this.currentUser = (global as any).currentUser;
    this.minioClient = (global as any).minioClient;
  });

  it('create dataset with bad group', async () => {
    const variables = {
      payload: {
        id: 'any-id',
        groupName: 'no-such-group',
      },
    };

    const result = await this.graphqlRequest(
      `
      mutation CreateDatasetMutation($payload: DatasetV2CreateInput!) {
        createDatasetV2(data: $payload) {
          id
        }
      }
    `,
      variables
    );

    expect(result[0].message).to.be.eq('user not auth');
  });

  it('create dataset with valid input', async () => {
    const datasetId = newId();
    const variables = {
      payload: {
        id: datasetId,
        groupName: GROUP_NAME,
      },
    };

    const result = await createDataset(this.graphqlRequest, variables);

    // verify result data
    const { id, name, createdBy, tags, size } = result.createDatasetV2;
    expect(id).to.be.eq(datasetId);
    expect(name).to.be.eq(datasetId); // default name will be the id
    expect(createdBy).to.be.eq(this.currentUser.username);
    expect(tags).deep.eq([]);
    expect(size).to.be.eq(0);

    const metadata = await getMetadata(
      this.minioClient,
      BUCKET_NAME,
      GROUP_NAME,
      datasetId
    );
    expect(result.createDatasetV2).deep.eq({ id, ...metadata });
  });

  it('update dataset', async () => {
    const datasetId = newId();
    const datasetName = newId();
    const whereCriteria = {
      id: datasetId,
      groupName: GROUP_NAME,
    };

    const dataset = await createDataset(this.graphqlRequest, {
      payload: { ...whereCriteria, tags: ['a', 'b'] },
    });
    const { createdAt: t1, updatedAt: t2 } = dataset.createDatasetV2;
    expect(moment(t2).diff(t1, 'seconds')).to.be.eq(0);

    console.log('before update', dataset);

    // delay a few seconds for verifying update time
    await delay(2500);

    const updatedDataset = await updateDataset(
      this.graphqlRequest,
      whereCriteria,
      {
        name: datasetName,
        groupName: GROUP_NAME,
        tags: null,
      }
    );
    console.log('after update', updatedDataset);

    const { id, name, createdBy, tags, size, createdAt, updatedAt } =
      updatedDataset.updateDatasetV2;
    expect(id).to.be.eq(datasetId);
    expect(name).to.be.eq(datasetName); // name could be different with id
    expect(createdBy).to.be.eq(this.currentUser.username);
    expect(tags).deep.eq([]); // update tags to null will be []
    expect(size).to.be.eq(0);

    // diff should be greater than or equals 2
    const diffSeconds = moment(updatedAt).diff(createdAt, 'seconds');
    expect(diffSeconds).to.be.gte(2);
  });

  it('query dataset', async () => {
    // clean datasets before test
    removeAllDatasetFiles(this.minioClient);

    // create 30 datasets => will be 3 pages
    for (let i = 0; i < 30; i++) {
      const datasetId = i + 1 < 10 ? `0${i + 1}` : `${i + 1}`;
      await createDataset(this.graphqlRequest, {
        payload: { groupName: GROUP_NAME, id: datasetId },
      });
    }

    // check page 1
    const page1 = await listDatasets(this.graphqlRequest, 1, null);
    console.log('page1', page1);
    const { pageInfo: p1, edges: e1 } = page1.datasetV2Connection;
    expect(p1.totalPage).to.be.eq(3);
    expect(p1.currentPage).to.be.eq(1);
    expect(e1.length).to.be.eq(10); // 10 items in each page
    expect(e1[0].node.id).to.be.eq('01');
    expect(e1[9].node.id).to.be.eq('10');

    // check page 2
    const page2 = await listDatasets(this.graphqlRequest, 2, null);
    console.log('page2', page2);
    const { pageInfo: p2, edges: e2 } = page2.datasetV2Connection;
    expect(p2.totalPage).to.be.eq(3);
    expect(p2.currentPage).to.be.eq(2);
    expect(e2.length).to.be.eq(10); // 10 items in each page
    expect(e2[0].node.id).to.be.eq('11');
    expect(e2[9].node.id).to.be.eq('20');

    // check page 3
    const page3 = await listDatasets(this.graphqlRequest, 3, null);
    console.log('page3', page3);
    const { pageInfo: p3, edges: e3 } = page3.datasetV2Connection;
    expect(p3.totalPage).to.be.eq(3);
    expect(p3.currentPage).to.be.eq(3);
    expect(e3.length).to.be.eq(10); // 10 items in each page
    expect(e3[0].node.id).to.be.eq('21');
    expect(e3[9].node.id).to.be.eq('30');

    // check search will match any dataset names having '3'
    const pageSearch = await listDatasets(this.graphqlRequest, 1, '3');
    const searchResult = pageSearch.datasetV2Connection.edges.map(
      x => x.node.id
    );
    expect(['03', '13', '23', '30']).to.deep.eq(searchResult);
  });

  it('delete dataset with files', async () => {
    const datasetId = newId();
    await createDataset(this.graphqlRequest, {
      payload: { groupName: GROUP_NAME, id: datasetId },
    });

    // create a file in the dataset
    const content = Buffer.from('i am the data', 'utf-8');
    const mc: Client = this.minioClient;
    await mc.putObject(
      BUCKET_NAME,
      `groups/${GROUP_NAME}/datasets/${datasetId}/file-1.txt`,
      content
    );
    await mc.putObject(
      BUCKET_NAME,
      `groups/${GROUP_NAME}/datasets/${datasetId}/file-2.txt`,
      content
    );

    const beforeDeleteList = await listObjects(
      this.minioClient,
      BUCKET_NAME,
      `groups/${GROUP_NAME}/datasets/${datasetId}/`
    );
    expect(3, 'there is 3 files {.dataset and two data files}').to.be.eq(
      beforeDeleteList.length
    );

    const result = await this.graphqlRequest(
      `mutation DeleteDatasetMutation($where: DatasetV2WhereUniqueInput!) {
      deleteDatasetV2(where: $where) {
        id
      }
    }`,
      {
        where: {
          groupName: GROUP_NAME,
          id: datasetId,
        },
      }
    );
    expect(result.deleteDatasetV2.id).to.be.eq(datasetId);

    const getResult = await this.graphqlRequest(
      `query DatasetQuery($where: DatasetV2WhereUniqueInput!) {
      datasetV2(where: $where) {
        id
      }
    }`,
      {
        where: {
          groupName: GROUP_NAME,
          id: datasetId,
        },
      }
    );

    expect('RESOURCE_NOT_FOUND').to.be.eq(getResult[0]?.extensions?.code);

    const afterDeleteList = await listObjects(
      this.minioClient,
      BUCKET_NAME,
      `groups/${GROUP_NAME}/datasets/${datasetId}/`
    );

    expect(0, 'there is no files after deletion').to.be.eq(
      afterDeleteList.length
    );
  });
});

async function listDatasets(graphqlRequest, page: number, search: string) {
  return graphqlRequest(
    `query GetDatasets($page: Int, $where: DatasetV2WhereInput) {
      datasetV2Connection(page: $page, where: $where) {
        edges {
          cursor
          node {
            id
            name
            createdBy
            createdAt
            updatedAt
            tags
            size
          }
        }
        pageInfo {
          currentPage
          totalPage
        }
      }
    }`,
    {
      page,
      where: {
        groupName: GROUP_NAME,
        search,
      },
    }
  );
}

function removeAllDatasetFiles(mc: Client) {
  const stream = mc.listObjectsV2(
    BUCKET_NAME,
    `groups/${GROUP_NAME}/datasets/`,
    true,
    ''
  );
  stream.on('data', async obj => {
    await mc.removeObject(BUCKET_NAME, obj.name);
  });
}

async function updateDataset(
  graphqlRequest,
  whereCriteria: { id: string; groupName: string },
  payload: { groupName: string; tags?: string[]; name?: string }
) {
  return graphqlRequest(
    `
      mutation UpdateDatasetV2Mutation($payload: DatasetV2UpdateInput!, $where: DatasetV2WhereUniqueInput!) {
        updateDatasetV2(data: $payload, where: $where) {
          id
          name
          createdBy
          createdAt
          updatedAt
          tags
          size
        }
      }
      `,
    {
      payload,
      where: whereCriteria,
    }
  );
}

async function createDataset(
  graphqlRequest,
  variables: {
    payload: { id: string; groupName: string; tags?: string[]; name?: string };
  }
) {
  return graphqlRequest(
    `
      mutation CreateDatasetMutation($payload: DatasetV2CreateInput!) {
        createDatasetV2(data: $payload) {
          id
          name
          createdBy
          createdAt
          updatedAt
          tags
          size
        }
      }
    `,
    variables
  );
}

function newId() {
  return faker.internet.userName().toLowerCase();
}

async function getMetadata(minioClient, bucket, groupName, datasetId) {
  const objectStream = await minioClient.getObject(
    bucket,
    `groups/${groupName}/datasets/${datasetId}/.dataset`
  );
  return JSON.parse(await streamToString(objectStream));
}

function streamToString(stream): Promise<string> {
  // from https://stackoverflow.com/a/49428486
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(Buffer.from(chunk)));
    stream.on('error', err => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function listObjects(
  mc: Client,
  bucket: string,
  prefix: string
): Promise<any[]> {
  const objects = new Promise<any[]>((resolve, reject) => {
    const arr = [];
    const stream = mc.listObjectsV2(bucket, prefix);
    stream.on('data', obj => {
      console.log('listObjects', obj);
      arr.push(obj);
    });
    stream.on('error', err => {
      reject(err);
    });
    stream.on('end', () => {
      resolve(arr);
    });
  });
  return objects;
}
