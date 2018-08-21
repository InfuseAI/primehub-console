import axios from 'axios';
import faker from 'faker';
import minimist from 'minimist';
const argv = minimist(process.argv.slice(2));

const host = argv.host || 'http://localhost:3000';
const count = argv.count || 500;
const url = `${host}/graphql`;

const graphqlRequest = async (query, variables) => {
  const res = await axios
    .post(url, {
      operationName: null,
      query,
      variables
    });

  if (res.data && res.data.errors) {
    // tslint:disable-next-line:no-console
    console.log(JSON.stringify(res.data.errors, null, 2));
  }
  return res.data.data;
};

const main = async () => {
  for (let index = 0; index < count; index++) {
    const groupData = {
      name: faker.internet.userName().toLowerCase()
    };
    const data = await graphqlRequest(`
    mutation($data: GroupCreateInput!){
      createGroup (data: $data) { id name }
    }`, {
      data: groupData
    });
    // tslint:disable-next-line:no-console
    console.log(`create group: ${data.createGroup.name}`);
  }
};

main()
.then(() => {
  // tslint:disable-next-line:no-console
  console.log('done');
})
// tslint:disable-next-line:no-console
.catch(console.log);
