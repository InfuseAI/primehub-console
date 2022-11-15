import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import faker from 'faker';
import minimist from 'minimist';
const argv = minimist(process.argv.slice(2));

const baseUrl = argv.baseUrl || 'http://localhost:8080/auth';
const count = argv.count || 500;
const realm = argv.realm || 'master';
const user = argv.user || 'wwwy3y3';
const pwd = argv.pwd || 'wwwy3y3';
const clientId = argv.clientId || 'admin-cli';

const main = async () => {
  const client = new KeycloakAdminClient({
    realmName: realm,
    baseUrl
  });

  await client.auth({
    username: user,
    password: pwd,
    clientId,
    grantType: 'password',
  });

  for (let index = 0; index < count; index++) {
    const userData = {
      username: faker.internet.userName().toLowerCase(),
      firstName: faker.name.firstName(),
      email: faker.internet.email().toLowerCase()
    };
    await client.users.create(userData);
    // tslint:disable-next-line:no-console
    console.log(`create user: ${userData.username}`);
  }
};

main()
.then(() => {
  // tslint:disable-next-line:no-console
  console.log('done');
})
// tslint:disable-next-line:no-console
.catch(console.log);
