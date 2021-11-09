// tslint:disable:no-unused-expression
import chai from "chai";
import chaiHttp = require("chai-http");
import faker from "faker";
import moment = require("moment");

chai.use(chaiHttp);

const expect = chai.expect;
const BUCKET_NAME = "test";
const GROUP_NAME = "test";

describe("dataset v2 graphql", function () {
  before(async () => {
    this.graphqlRequest = (global as any).graphqlRequest;
    this.currentUser = (global as any).currentUser;
    this.minioClient = (global as any).minioClient;
  });

  it("create dataset with bad group", async () => {
    const variables = {
      payload: {
        id: "any-id",
        groupName: "no-such-group",
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

    expect(result[0].message).to.be.eq("user not auth");
  });

  it("create dataset with valid input", async () => {
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

  it("update dataset", async () => {
    const datasetId = newId();
    const datasetName = newId();
    const whereCriteria = {
      id: datasetId,
      groupName: GROUP_NAME,
    };

    const dataset = await createDataset(this.graphqlRequest, {
      payload: { ...whereCriteria, tags: ["a", "b"] },
    });
    const { createdAt: t1, updatedAt: t2 } = dataset.createDatasetV2;
    expect(moment(t2).diff(t1, "seconds")).to.be.eq(0);

    console.log("before update", dataset);

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
    console.log("after update", updatedDataset);

    const { id, name, createdBy, tags, size, createdAt, updatedAt } =
      updatedDataset.updateDatasetV2;
    expect(id).to.be.eq(datasetId);
    expect(name).to.be.eq(datasetName); // name could be different with id
    expect(createdBy).to.be.eq(this.currentUser.username);
    expect(tags).deep.eq([]); // update tags to null will be []
    expect(size).to.be.eq(0);

    // diff should be greater than or equals 2
    const diffSeconds = moment(updatedAt).diff(createdAt, "seconds");
    expect(diffSeconds).to.be.gte(2);
  });

  it("query dataset", async () => {
    // TODO list, get
  });

  it("delete dataset with files", async () => {
    // TODO remove dataset
  });
});

async function updateDataset(
  graphqlRequest,
  whereCriteria: { id: string; groupName: string },
  payload: { groupName: string; tags?: string[]; name?: string }
) {
  return await graphqlRequest(
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
      payload: payload,
      where: whereCriteria,
    }
  );
}

async function createDataset(
  graphqlRequest,
  variables: { payload: { id: string; groupName: string; tags?: string[] } }
) {
  return await graphqlRequest(
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
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
