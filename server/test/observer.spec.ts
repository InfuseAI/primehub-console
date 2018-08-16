// tslint:disable:no-unused-expression
import chai from 'chai';
import BPromise from 'bluebird';
import chaiHttp = require('chai-http');
import Observer from '../src/observer/observer';
import CrdClient from '../src/crdClient/crdClientImpl';
import faker from 'faker';
import KeycloakAdminClient from 'keycloak-admin';
import { cleaupAllCrd } from './sandbox';
import { pick } from 'lodash';

chai.use(chaiHttp);

const expect = chai.expect;

declare module 'mocha' {
  // tslint:disable-next-line:interface-name
  interface ISuiteCallbackContext {
    graphqlRequest?: (query: string, variables?: any) => Promise<any>;
    kcAdminClient?: KeycloakAdminClient;
    crdClient: CrdClient;
    observer: Observer;
    // mock functions
    mockDataset?: () => Promise<any>;
    mockImage?: () => Promise<any>;
    mockInstanceType?: () => Promise<any>;
  }
}

describe('observer', function() {
  before(async () => {
    this.crdClient = (global as any).crdClient;
    this.graphqlRequest = (global as any).graphqlRequest;
    this.kcAdminClient = (global as any).kcAdminClient;
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
      everyoneGroupId: process.env.KC_EVERYONE_GROUP_ID
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
    datasets.push(await this.graphqlRequest(`
    mutation($data: DatasetCreateInput!){
      createDataset (data: $data) { id }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-')
      }
    }));

    images.push(await this.graphqlRequest(`
    mutation($data: ImageCreateInput!){
      createImage (data: $data) { id }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-')
      }
    }));

    instanceTypes.push(await this.graphqlRequest(`
    mutation($data: InstanceTypeCreateInput!){
      createInstanceType (data: $data) { id }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-')
      }
    }));

    // create some resources on k8s only
    datasets.push(await this.mockDataset());
    images.push(await this.mockImage());
    instanceTypes.push(await this.mockInstanceType());

    // start observer and wait
    this.observer.observe();
    await BPromise.delay(1000);

    // check if roles created on keycloak
    const roles = await this.kcAdminClient.roles.find();
    datasets.forEach(dataset => {
      expect(roles.find(role => role.name === `ds:${dataset.name}`)).to.be.ok;
    });

    images.forEach(image => {
      expect(roles.find(role => role.name === `img:${image.name}`)).to.be.ok;
    });

    instanceTypes.forEach(instance => {
      expect(roles.find(role => role.name === `it:${instance.name}`)).to.be.ok;
    });
  });
});
