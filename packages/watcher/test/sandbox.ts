/**
 * create new realm
 * with everyGroup and assign to env
 */
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import * as k8s from '@kubernetes/client-node';
import faker from 'faker';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import CrdClient from '@infuseai/graphql-server/src/crdClient/crdClientImpl';
import { GrantTypes } from '@keycloak/keycloak-admin-client/lib/utils/auth';
const crdClient = new CrdClient();
(global as any).crdClient = crdClient;

const loadCrd = (name: string): any =>
  yaml.load(fs.readFileSync(path.resolve(__dirname, `../../graphql-server/crd/${name}.yaml`), 'utf8'));

const datasetCrd = loadCrd('dataset');
const instanceTypeCrd = loadCrd('instance-type');
const imageCrd = loadCrd('image');

const masterRealmCred = {
  username: 'keycloak',
  password: 'keycloak',
  grantType: 'password' as GrantTypes,
  clientId: 'admin-cli'
};

const inCluster = (process.env.KUBERNETES_SERVICE_HOST && process.env.KUBERNETES_SERVICE_PORT);

// initialize k8s client
const kc = new k8s.KubeConfig();
if (inCluster) {
  kc.loadFromCluster();
} else {
  kc.loadFromFile(`${process.env.HOME}/.kube/config`);
}
const k8sClient = kc.makeApiClient(k8s.ApiextensionsV1Api);
(global as any).k8sClient = k8sClient;

export const assignAdmin = async (kcAdminClient: KeycloakAdminClient, realm: string, userId: string) => {
  const clients = await kcAdminClient.clients.find({realm});
  const realmManagementClient = clients.find(client => client.clientId === 'realm-management');

  if (!realmManagementClient) {
    return;
  }

  const role = await kcAdminClient.clients.findRole({
    realm,
    id: realmManagementClient.id,
    roleName: 'realm-admin'
  });

  await kcAdminClient.users.addClientRoleMappings({
    realm,
    id: userId,
    clientUniqueId: realmManagementClient.id,
    roles: [{
      id: role.id,
      name: role.name
    }]
  });
};

export const cleanupDatasets = async () => {
  const datasets = await crdClient.datasets.list();
  await Promise.all(datasets.map(async dataset => {
    await crdClient.datasets.del(dataset.metadata.name);
  }));
};

export const cleanupImages = async () => {
  const images = await crdClient.images.list();
  await Promise.all(images.map(async image => {
    await crdClient.images.del(image.metadata.name);
  }));
};

export const cleanupInstanceTypes = async () => {
  const instanceTypes = await crdClient.instanceTypes.list();
  await Promise.all(instanceTypes.map(async instanceType => {
    await crdClient.instanceTypes.del(instanceType.metadata.name);
  }));
};

export const cleaupAllCrd = async () => {
  await cleanupDatasets();
  await cleanupImages();
  await cleanupInstanceTypes();
};

export const createSandbox = async () => {
  /**
   * k8s
   */
  await k8sClient.createCustomResourceDefinition(datasetCrd);
  await k8sClient.createCustomResourceDefinition(instanceTypeCrd);
  await k8sClient.createCustomResourceDefinition(imageCrd);

  /**
   * Keycloak
   */
  const client = new KeycloakAdminClient({
    baseUrl: process.env.KC_API_BASEURL || 'http://127.0.0.1:8080/auth'
  });
  (global as any).kcAdminClient = client;

  // authorize with username/passowrd
  (global as any).authKcAdmin = async () => {
    await client.auth(masterRealmCred);
  };

  await (global as any).authKcAdmin();
  // create new realm
  const realmId = faker.internet.userName().toLowerCase();
  await client.realms.create({
    id: realmId,
    realm: realmId,
    enabled: true
    // smtpServer: {
    //   auth: true,
    //   from: '0830021730-07fb21@inbox.mailtrap.io',
    //   host: 'smtp.mailtrap.io',
    //   user: process.env.SMTP_USER,
    //   password: process.env.SMTP_PWD
    // }
  });

  // create a group
  const groupName = 'everyone';
  await client.groups.create({
    realm: realmId,
    name: groupName
  });

  // find the group
  const groups = await client.groups.find({realm: realmId, search: groupName});
  const group = groups[0];

  // create admin user
  const username = faker.internet.userName().toLowerCase();
  const password = 'password';
  await client.users.create({
    realm: realmId,
    username,
    email: faker.internet.email(),
    // enabled required to be true in order to send actions email
    emailVerified: true,
    enabled: true,
    credentials: [{
      temporary: false,
      type: 'password',
      value: password
    }]
  });

  // assignAdmin
  const users = await client.users.find({realm: realmId, username});
  await assignAdmin(client, realmId, users[0].id);

  // create new client
  const authClientId = faker.internet.userName();
  await client.clients.create({
    realm: realmId,
    clientId: authClientId,
    attributes: {},
    enabled: true,
    protocol: 'openid-connect',
    redirectUris: []
  });
  const authClients = await client.clients.find({
    realm: realmId,
    clientId: authClientId
  });
  const authClient = authClients[0];

  // update authClient
  await client.clients.update({
    realm: realmId,
    id: authClient.id
  }, {
    clientId: authClient.clientId,
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

  const serviceAccountUser = await client.clients.getServiceAccountUser({
    realm: realmId,
    id: authClient.id
  });

  // add admin role to client
  await assignAdmin(client, realmId, serviceAccountUser.id);

  // get client secret
  const clientSecret = await client.clients.getClientSecret({
    realm: realmId,
    id: authClient.id
  });

  // assign to env
  process.env.KC_REALM = realmId;
  process.env.KC_EVERYONE_GROUP_ID = group.id;
  process.env.KC_USERNAME = username;
  process.env.KC_PWD = password;
  process.env.SHARED_GRAPHQL_SECRET_KEY = 'secret';
  process.env.KC_CLIENT_ID = authClient.clientId;
  process.env.KC_CLIENT_SECRET = clientSecret.value;
};

export const destroySandbox = async () => {
  /**
   * k8s
   */
  await cleaupAllCrd();

  try {
    await k8sClient.deleteCustomResourceDefinition(datasetCrd.metadata.name);
    await k8sClient.deleteCustomResourceDefinition(instanceTypeCrd.metadata.name);
    await k8sClient.deleteCustomResourceDefinition(imageCrd.metadata.name);
  } catch (e) {
    // tslint:disable-next-line:no-console
    console.log(e);
  }

  /**
   * Keycloak
   */
  const client = new KeycloakAdminClient({
    baseUrl: process.env.KC_API_BASEURL || 'http://127.0.0.1:8080/auth'
  });

  // authorize with username/passowrd
  await client.auth(masterRealmCred);

  await client.realms.del({
    realm: process.env.KC_REALM
  });
};
