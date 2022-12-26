// tslint:disable:no-unused-expression
import chai from 'chai';
import BPromise from 'bluebird';
import chaiHttp = require('chai-http');
import Observer from '../src/observer';
import CrdClient from '@infuseai/graphql-server/src/crdClient/crdClientImpl';
import faker from 'faker';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { cleaupAllCrd, assignAdmin } from './sandbox';
import { pick } from 'lodash';
import { Issuer, custom } from 'openid-client';

chai.use(chaiHttp);

const expect = chai.expect;

declare module 'mocha' {
  // tslint:disable-next-line:interface-name
  interface ISuiteCallbackContext {
    kcAdminClient?: KeycloakAdminClient;
    kcAdminClientForObserver?: KeycloakAdminClient;
    mutations: any;
    crdClient: CrdClient;
    observer: Observer;
    // mock functions
    mockDataset?: () => Promise<any>;
    mockImage?: () => Promise<any>;
    mockInstanceType?: () => Promise<any>;
    everyoneGroupId: string;
    oidcClient?: any;
  }
}

describe('observer', function() {
  before(async () => {
    const realmName = process.env.KC_REALM;
    this.kcAdminClient = (global as any).kcAdminClient;
    await (global as any).authKcAdmin();
    this.crdClient = (global as any).crdClient;
    this.mutations = (global as any).mutations;

    // create a new client
    const clientId = faker.internet.userName();
    await this.kcAdminClient.clients.create({
      realm: realmName,
      clientId,
      attributes: {},
      enabled: true,
      protocol: 'openid-connect',
      redirectUris: []
    });
    const clients = await this.kcAdminClient.clients.find({
      realm: realmName,
      clientId
    });
    const client = clients[0];

    // update client
    await this.kcAdminClient.clients.update({
      realm: realmName,
      id: client.id
    }, {
      clientId: client.clientId,
      attributes: {
        'display.on.consent.screen': 'false',
        'exclude.session.state.from.auth.response': 'false',
        'saml_force_name_id_format': 'false',
        'saml.assertion.signature': 'false',
        'saml.authnstatement': 'false',
        'saml.client.signature': 'false',
        'saml.encrypt': 'false',
        'saml.force.post.binding': 'false',
        'saml.multivalued.roles': 'false',
        'saml.onetimeuse.condition': 'false',
        'saml.server.signature': 'false',
        'saml.server.signature.keyinfo.ext': 'false',
        'tls.client.certificate.bound.access.tokens': 'false'
      },
      authenticationFlowBindingOverrides: {},
      authorizationServicesEnabled: false,
      bearerOnly: false,
      clientAuthenticatorType: 'client-secret',
      consentRequired: false,
      defaultClientScopes: ['role_list', 'profile', 'email'],
      directAccessGrantsEnabled: true,
      frontchannelLogout: false,
      fullScopeAllowed: true,
      implicitFlowEnabled: false,
      nodeReRegistrationTimeout: -1,
      notBefore: 0,
      optionalClientScopes: ['address', 'phone', 'offline_access'],
      protocol: 'openid-connect',
      publicClient: false,
      serviceAccountsEnabled: true,
      standardFlowEnabled: true,
      surrogateAuthRequired: false,
      webOrigins: [],
      redirectUris: [
        'http://localhost:3000/*'
      ]
    });

    const serviceAccountUser = await this.kcAdminClient.clients.getServiceAccountUser({
      realm: realmName,
      id: client.id
    });

    // add admin role to client
    await assignAdmin(this.kcAdminClient, realmName, serviceAccountUser.id);

    // get client secret
    const clientSecret = await this.kcAdminClient.clients.getClientSecret({
      realm: realmName,
      id: client.id
    });
    const baseUrl = process.env.KC_OIDC_BASEURL || 'http://127.0.0.1:8080/auth';
    const apiBaseUrl = process.env.KC_API_BASEURL || 'http://127.0.0.1:8080/auth';
    // tslint:disable-next-line:max-line-length
    const issuer = await Issuer.discover(`${baseUrl}/realms/${realmName}/.well-known/openid-configuration`);
    const oidcClient = new issuer.Client({
      client_id: clientId,
      client_secret: clientSecret.value
    });
    oidcClient[custom.clock_tolerance] = 5 * 60;

    // assign to this scope
    this.kcAdminClientForObserver = new KeycloakAdminClient({
      baseUrl: apiBaseUrl,
      realmName
    });
    this.oidcClient = oidcClient;
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

  beforeEach(async () => {
    this.observer = new Observer({
      crdClient: this.crdClient as any,
      keycloakAdmin: this.kcAdminClientForObserver,
      everyoneGroupId: this.everyoneGroupId,
      getAccessToken: async () => {
        const tokenSet = await this.oidcClient.grant({
          grant_type: 'client_credentials'
        });
        return tokenSet.access_token;
      }
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
    // const {createDataset: dataset} = await this.graphqlRequest(`
    // mutation($data: DatasetCreateInput!){
    //   createDataset (data: $data) { id name }
    // }`, {
    //   data: {
    //     name: faker.internet.userName().toLowerCase().replace(/_/g, '-')
    //   }
    // });
    // datasets.push(dataset);

    // const {createImage: image} = await this.graphqlRequest(`
    // mutation($data: ImageCreateInput!){
    //   createImage (data: $data) { id name }
    // }`, {
    //   data: {
    //     name: faker.internet.userName().toLowerCase().replace(/_/g, '-')
    //   }
    // });
    // images.push(image);

    // const {createInstanceType: instanceType} = await this.graphqlRequest(`
    // mutation($data: InstanceTypeCreateInput!){
    //   createInstanceType (data: $data) { id name }
    // }`, {
    //   data: {
    //     name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
    //     cpuLimit: 2,
    //     memoryLimit: 2,
    //     cpuRequest: 2,
    //     memoryRequest: 2
    //   }
    // });
    // instanceTypes.push(instanceType);

    // create some resources on k8s only
    datasets.push(await this.mockDataset());
    images.push(await this.mockImage());
    instanceTypes.push(await this.mockInstanceType());

    // start observer and wait
    this.observer.observe();
    await BPromise.delay(2000);

    // check if roles created on keycloak
    const roles = await this.kcAdminClientForObserver.roles.find();

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
    await BPromise.delay(2000);

    // create some resources on k8s only
    datasets.push(await this.mockDataset());

    // create some resources from graphql
    // const {createDataset: dataset} = await this.graphqlRequest(`
    // mutation($data: DatasetCreateInput!){
    //   createDataset (data: $data) { id name }
    // }`, {
    //   data: {
    //     name: faker.internet.userName().toLowerCase().replace(/_/g, '-')
    //   }
    // });
    // datasets.push(dataset);

    // check if roles created on keycloak
    await BPromise.delay(2000);
    const roles = await this.kcAdminClientForObserver.roles.find();
    datasets.forEach(e => {
      expect(roles.find(role => role.name === `ds:${e.name}`)).to.be.ok;
    });
  });

  it('should detect delete event', async () => {
    const datasets = [];
    this.observer.observe();
    await BPromise.delay(2000);

    // create some resources on k8s only
    datasets.push(await this.mockDataset());
    await BPromise.delay(2000);

    // create some resources from graphql
    // const {createDataset: dataset} = await this.graphqlRequest(`
    // mutation($data: DatasetCreateInput!){
    //   createDataset (data: $data) { id name }
    // }`, {
    //   data: {
    //     name: faker.internet.userName().toLowerCase().replace(/_/g, '-')
    //   }
    // });
    // datasets.push(dataset);

    // delete on k8s
    this.crdClient.datasets.del(datasets[0].name);
    // delete on api
    // await this.graphqlRequest(`
    // mutation($where: DatasetWhereUniqueInput!){
    //   deleteDataset (where: $where) { id }
    // }`, {
    //   where: {id: datasets[1].id}
    // });

    // check roles not exist on keycloak
    await BPromise.delay(2000);
    const roles = await this.kcAdminClientForObserver.roles.find();

    datasets.forEach(e => {
      expect(roles.find(role => role.name === `ds:${e.name}`)).to.be.not.ok;
    });
  });
});
