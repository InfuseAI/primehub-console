// tslint:disable:no-unused-expression
import chai from 'chai';
import BPromise from 'bluebird';
import chaiHttp = require('chai-http');
import Observer from '../src/observer/observer';
import CrdClient from '../src/crdClient/crdClientImpl';
import faker from 'faker';
import KcAdminClient from 'keycloak-admin';
import { cleaupAllCrd } from './sandbox';
import { pick } from 'lodash';

chai.use(chaiHttp);

const expect = chai.expect;

declare module 'mocha' {
  // tslint:disable-next-line:interface-name
  interface ISuiteCallbackContext {
    graphqlRequest?: (query: string, variables?: any) => Promise<any>;
    kcAdminClient?: KcAdminClient;
    crdClient: CrdClient;
    observer: Observer;
    // mock functions
    mockDataset?: () => Promise<any>;
    mockImage?: () => Promise<any>;
    mockInstanceType?: () => Promise<any>;
    everyoneGroupId: string;
  }
}

describe('observer', function() {
  before(async () => {
    this.crdClient = (global as any).crdClient;
    this.graphqlRequest = (global as any).graphqlRequest;
    const client = new KcAdminClient({
      realmName: process.env.KC_REALM
    });
    // authorize with username/passowrd
    await client.auth({
      username: process.env.KC_USERNAME,
      password: process.env.KC_PWD,
      grantType: 'password',
      clientId: 'admin-cli'
    });
    this.kcAdminClient = client;
    this.everyoneGroupId = process.env.KC_EVERYONE_GROUP_ID;
    this.mockDataset = async () => {
      const data = {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
        description: 'description',
        displayName: 'displayname',
        access: 'everyone',
        type: 'git'
      };
      this.crdClient.datasets.create(
        pick(data, ['name', 'description']),
        pick(data, ['displayName', 'access', 'type'])
      );
      return {id: data.name, ...data};
    };

    this.mockImage = async () => {
      const data = {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
        description: 'description',
        displayName: 'displayname',
        url: 'url'
      };
      this.crdClient.images.create(
        pick(data, ['name', 'description']),
        pick(data, ['displayName', 'url'])
      );
      return {id: data.name, ...data};
    };

    this.mockInstanceType = async () => {
      const data = {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
        description: 'description',
        displayName: 'displayname',
        cpuLimit: 20,
        cpuRequest: 20,
        memoryRequest: 2
      };
      this.crdClient.instanceTypes.create(
        pick(data, ['name', 'description']),
        pick(data, ['displayName', 'cpuLimit', 'cpuRequest', 'memoryRequest'])
      );
      return {id: data.name, ...data};
    };
  });

  after(async () => {
    await cleaupAllCrd();
  });

  beforeEach(() => {
    this.observer = new Observer({
      crdClient: this.crdClient,
      keycloakAdmin: this.kcAdminClient,
      everyoneGroupId: this.everyoneGroupId
    });
  });

  afterEach(() => {
    this.observer.abort();
  });

  it('resources shoule be synchronized', async () => {
    const datasets: any = [];
    const images: any = [];
    const instanceTypes: any = [];

    // create some resources from graphql
    const {createDataset: dataset} = await this.graphqlRequest(`
    mutation($data: DatasetCreateInput!){
      createDataset (data: $data) { id name }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-')
      }
    });
    datasets.push(dataset);

    const {createImage: image} = await this.graphqlRequest(`
    mutation($data: ImageCreateInput!){
      createImage (data: $data) { id name }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-')
      }
    });
    images.push(image);

    const {createInstanceType: instanceType} = await this.graphqlRequest(`
    mutation($data: InstanceTypeCreateInput!){
      createInstanceType (data: $data) { id name }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-')
      }
    });
    instanceTypes.push(instanceType);

    // create some resources on k8s only
    datasets.push(await this.mockDataset());
    images.push(await this.mockImage());
    instanceTypes.push(await this.mockInstanceType());

    // start observer and wait
    this.observer.observe();
    await BPromise.delay(1000);

    // check if roles created on keycloak
    const roles = await this.kcAdminClient.roles.find();

    datasets.forEach(e => {
      expect(roles.find(role => role.name === `ds:${e.name}`)).to.be.ok;
    });

    images.forEach(e => {
      expect(roles.find(role => role.name === `img:${e.name}`)).to.be.ok;
    });

    instanceTypes.forEach(e => {
      expect(roles.find(role => role.name === `it:${e.name}`)).to.be.ok;
    });
  });

  it('should detect add event', async () => {
    const datasets = [];
    this.observer.observe();
    await BPromise.delay(1000);

    // create some resources on k8s only
    datasets.push(await this.mockDataset());

    // create some resources from graphql
    const {createDataset: dataset} = await this.graphqlRequest(`
    mutation($data: DatasetCreateInput!){
      createDataset (data: $data) { id name }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-')
      }
    });
    datasets.push(dataset);

    // check if roles created on keycloak
    const roles = await this.kcAdminClient.roles.find();

    datasets.forEach(e => {
      expect(roles.find(role => role.name === `ds:${e.name}`)).to.be.ok;
    });
  });

  it('should detect delete event', async () => {
    const datasets = [];
    this.observer.observe();
    await BPromise.delay(1000);

    // create some resources on k8s only
    datasets.push(await this.mockDataset());

    // create some resources from graphql
    const {createDataset: dataset} = await this.graphqlRequest(`
    mutation($data: DatasetCreateInput!){
      createDataset (data: $data) { id name }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-')
      }
    });
    datasets.push(dataset);

    // delete on k8s
    this.crdClient.datasets.del(datasets[0].name);
    // delete on api
    await this.graphqlRequest(`
    mutation($where: DatasetWhereUniqueInput!){
      deleteDataset (where: $where) { id }
    }`, {
      where: {id: datasets[1].id}
    });

    // check roles not exist on keycloak
    const roles = await this.kcAdminClient.roles.find();

    datasets.forEach(e => {
      expect(roles.find(role => role.name === `ds:${e.name}`)).to.be.not.ok;
    });
  });
});
