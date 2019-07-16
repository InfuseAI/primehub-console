// tslint:disable:no-console
import KcClient from 'keycloak-admin';
import minimist from 'minimist';
import { sampleSize, random } from 'lodash';
const argv = minimist(process.argv.slice(2));

const baseUrl = argv.baseUrl || 'http://localhost:8080/auth';
const realm = argv.realm || 'master';
const user = argv.user || 'wwwy3y3';
const pwd = argv.pwd || 'wwwy3y3';
const clientId = argv.clientId || 'admin-cli';
const min = argv.min || 5;
const max = argv.max || 10;

const main = async () => {
  const client = new KcClient({
    realmName: realm,
    baseUrl
  });

  await client.auth({
    username: user,
    password: pwd,
    clientId,
    grantType: 'password',
  });

  const users = await client.users.find({max: 100000});
  const groups = await client.groups.find({max: 100000});
  for (const kcUser of users) {
    // check how many group this user has
    const userGroups = await client.users.listGroups({
      id: kcUser.id
    });
    if (userGroups && userGroups.length >= min) {
      // already minimum
      console.log(`skip user ${kcUser.id}, it already has min groups`);
      continue;
    }
    // add groups to user
    const groupCount = random(min, max);
    const sampledGroups = sampleSize(groups, groupCount);
    for (const group of sampledGroups) {
      await client.users.addToGroup({
        id: kcUser.id,
        groupId: group.id
      });
    }
    console.log(`add user ${kcUser.id} to ${groupCount} groups`);
  }
};

main()
.then(() => {
  // tslint:disable-next-line:no-console
  console.log('done');
})
// tslint:disable-next-line:no-console
.catch(console.log);
