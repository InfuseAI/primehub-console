/**
 * create new realm
 * with everyGroup and assign to env
 */
import KcAdminClient from 'keycloak-admin';
import kubeClient from 'kubernetes-client';
import faker from 'faker';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import CrdClient from '../src/crdClient/crdClientImpl';
import { createMinioClient } from '../src/utils/minioClient';
import { GrantTypes } from 'keycloak-admin/lib/utils/auth';
const crdClient = new CrdClient();
(global as any).crdClient = crdClient;

const loadCrd = (name: string): any =>
  yaml.safeLoad(fs.readFileSync(path.resolve(__dirname, `../crd/${name}.spec.yaml`), 'utf8'));

const datasetCrd = loadCrd('dataset');
const instanceTypeCrd = loadCrd('instance-type');
const imageCrd = loadCrd('image');
const phApplicationCrd = loadCrd('phApplication');
const phJobCrd = loadCrd('phJob');
const phScheduleCrd = loadCrd('phSchedule');
const phDeploymentCrd = loadCrd('phDeployment');

const masterRealmCred = {
  username: 'keycloak',
  password: 'keycloak',
  grantType: 'password' as GrantTypes,
  clientId: 'admin-cli'
};

console.log('Creating minio bucket for test');
const mClient = createMinioClient('http://127.0.0.1:9000', 'minioadmin', 'minioadmin');
mClient.makeBucket('test', '', err => {
  if (err) return console.log('Error creating bucket.', err);
  console.log('Bucket created successfully.');
});
(global as any).minioClient = mClient;

const inCluster = (process.env.KUBERNETES_SERVICE_HOST && process.env.KUBERNETES_SERVICE_PORT);

// initialize k8s client
const Client = (kubeClient as any).Client;
const config = (kubeClient as any).config;
const k8sClient = new Client({
  config: inCluster ? config.getInCluster() : config.fromKubeconfig(),
  version: '1.10'
});
(global as any).k8sClient = k8sClient;

export const assignAdmin = async (kcAdminClient: KcAdminClient, realm: string, userId: string) => {
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

export const cleanupPhJobs = async () => {
  try {
    const phJobs = await crdClient.phJobs.list();
    await Promise.all(phJobs.map(async phJob => {
      await crdClient.phJobs.del(phJob.metadata.name);
    }));
  } catch (error) {
    // tslint:disable-next-line:no-console
    console.log('fail to cleanup phjobs');
    // tslint:disable-next-line:no-console
    console.log(error);
    return;
  }
};

export const cleaupAllCrd = async () => {
  await cleanupDatasets();
  await cleanupImages();
  await cleanupInstanceTypes();
};

const checkNotProduction = async () => {
  try {
    await k8sClient.apis['apiextensions.k8s.io'].v1beta1
      .crd('datasets.primehub.io')
      .get();
  } catch (e) {
    return;
  }
  throw new Error(
    `Prouction environment? The crd 'datasets.primehub.io' is found in the cluster. `
  );
};

export const createSandbox = async () => {
  await checkNotProduction();

  /**
   * k8s
   */
  try {
    await Promise.all([
      k8sClient.apis['apiextensions.k8s.io'].v1beta1.crd.post({ body: datasetCrd }),
      k8sClient.apis['apiextensions.k8s.io'].v1beta1.crd.post({ body: instanceTypeCrd }),
      k8sClient.apis['apiextensions.k8s.io'].v1beta1.crd.post({ body: imageCrd }),
      k8sClient.apis['apiextensions.k8s.io'].v1beta1.crd.post({ body: phApplicationCrd }),
      k8sClient.apis['apiextensions.k8s.io'].v1beta1.crd.post({ body: phJobCrd }),
      k8sClient.apis['apiextensions.k8s.io'].v1beta1.crd.post({ body: phScheduleCrd }),
      k8sClient.apis['apiextensions.k8s.io'].v1beta1.crd.post({ body: phDeploymentCrd }),
    ]);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
  }

  /**
   * Keycloak
   */
  const client = new KcAdminClient({
    baseUrl: process.env.KC_API_BASEURL || 'http://127.0.0.1:8080/auth'
  });
  (global as any).kcAdminClient = client;

  const realmId = faker.internet.userName().toLowerCase();

  // authorize with username/passowrd
  (global as any).authKcAdmin = async () => {
    await client.auth(masterRealmCred);
  };

  (global as any).addUserToGroup = async (groupId, id) => {
    await client.users.addToGroup({groupId, id, realm: realmId});
  };

  await (global as any).authKcAdmin();
  // create new realm
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

  const testGroupName = 'test';
  await client.groups.create({
    realm: realmId,
    name: testGroupName
  });

  // find the group
  const groups = await client.groups.find({realm: realmId, search: groupName});
  const group = groups[0];

  // find test group
  const testGroups = await client.groups.find({realm: realmId, search: testGroupName});
  const testGroup = testGroups[0];

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
  const user = users[0];
  await assignAdmin(client, realmId, user.id);

  // assign user to test group
  (global as any).addUserToGroup(testGroup.id, user.id);
  (global as any).currentUser = user;
  (global as any).currentGroup = testGroup;

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
  process.env.TEST_USER_ID = user.id;
  process.env.KC_PWD = password;
  process.env.SHARED_GRAPHQL_SECRET_KEY = 'secret';
  process.env.KC_CLIENT_ID = authClient.clientId;
  process.env.KC_CLIENT_SECRET = clientSecret.value;
  process.env.PRIMEHUB_FEATURE_STORE = 'true'; // enable store for test job artifacts
};

export const destroySandbox = async () => {
  await checkNotProduction();

  /**
   * k8s
   */
  await cleaupAllCrd();

  try {
    await Promise.all([
      k8sClient.apis['apiextensions.k8s.io'].v1beta1.crd(datasetCrd.metadata.name).delete(),
      k8sClient.apis['apiextensions.k8s.io'].v1beta1.crd(instanceTypeCrd.metadata.name).delete(),
      k8sClient.apis['apiextensions.k8s.io'].v1beta1.crd(imageCrd.metadata.name).delete(),
      k8sClient.apis['apiextensions.k8s.io'].v1beta1.crd(phApplicationCrd.metadata.name).delete(),
      k8sClient.apis['apiextensions.k8s.io'].v1beta1.crd(phJobCrd.metadata.name).delete(),
      k8sClient.apis['apiextensions.k8s.io'].v1beta1.crd(phScheduleCrd.metadata.name).delete(),
      k8sClient.apis['apiextensions.k8s.io'].v1beta1.crd(phDeploymentCrd.metadata.name).delete(),
    ]);
  } catch (e) {
    // tslint:disable-next-line:no-console
    console.log(e);
  }

  /**
   * Keycloak
   */
  const client = new KcAdminClient({
    baseUrl: process.env.KC_API_BASEURL || 'http://127.0.0.1:8080/auth'
  });

  // authorize with username/passowrd
  await client.auth(masterRealmCred);

  await client.realms.del({
    realm: process.env.KC_REALM
  });
};
