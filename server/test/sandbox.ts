/**
 * create new realm
 * with everyGroup and assign to env
 */
import KcAdminClient from 'keycloak-admin/lib';
import faker from 'faker';

const masterRealmCred = {
  username: 'wwwy3y3',
  password: 'wwwy3y3',
  grantType: 'password',
  clientId: 'admin-cli'
};

const assignAdmin = async (kcAdminClient: KcAdminClient, realm: string, userId: string) => {
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

export const createSandbox = async () => {
  const client = new KcAdminClient();

  // authorize with username/passowrd
  await client.auth(masterRealmCred);

  // create new realm
  const realmId = faker.internet.userName().toLowerCase();
  await client.realms.create({
    id: realmId,
    realm: realmId,
    enabled: true
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

  // assign to env
  process.env.KC_REALM = realmId;
  process.env.KC_EVERYONE_GROUP_ID = group.id;
  process.env.KC_USERNAME = username;
  process.env.KC_PWD = password;
};

export const destroySandbox = async () => {
  const client = new KcAdminClient();

  // authorize with username/passowrd
  await client.auth(masterRealmCred);

  await client.realms.del({
    realm: process.env.KC_REALM
  });
};
