// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import faker from 'faker';
import KeycloakAdminClient from 'keycloak-admin';
import {find} from 'lodash';
import { cleaupAllCrd } from './sandbox';

chai.use(chaiHttp);

const expect = chai.expect;

// utils
const userFields = `
  id
  username
  effectiveGroups {
    id
    name
    instanceTypes {
      id
    }
    images {
      id
    }
    datasets {
      id
      writable
    }
  }`;

// interface

declare module 'mocha' {
  // tslint:disable-next-line:interface-name
  interface ISuiteCallbackContext {
    graphqlRequest?: (query: string, variables?: any) => Promise<any>;
    kcAdminClient?: KeycloakAdminClient;
    currentUser?: any;
  }
}

describe('user effectiveGroups graphql', function() {
  before(async () => {
    this.graphqlRequest = (global as any).graphqlRequest;
    this.kcAdminClient = (global as any).kcAdminClient;
    await (global as any).authKcAdmin();
  });

  after(async () => {
    await cleaupAllCrd();
  });

  it('should expect effectiveGroups merge the instanceTypes, images, datasets correctly', async () => {
    // craete user
    const user = await createUser(this.graphqlRequest);

    // create group
    const group1 = await createGroup(this.graphqlRequest, {name: 'g1'});
    await assignUserToGroup(this.graphqlRequest, user, group1);

    const group2 = await createGroup(this.graphqlRequest, {name: 'g2'});
    await assignUserToGroup(this.graphqlRequest, user, group2);

    const group3 = await createGroup(this.graphqlRequest, {name: 'g3'});
    await assignUserToGroup(this.graphqlRequest, user, group3);

    const group4 = await createGroup(this.graphqlRequest, {name: 'g4'});

    // create instance type
    // it1 (g1, g2, g3)
    const it1 = await createInstanceType(this.graphqlRequest, {global: true});
    // it2 (g1)
    const it2 = await createInstanceType(this.graphqlRequest);
    await assignInstaceTypeToGroup(this.graphqlRequest, it2, group1);

    // create image
    // img1 (g1, g2, g3)
    const img1 = await createImage(this.graphqlRequest, {global: true});
    // img2 (g1)
    const img2 = await createImage(this.graphqlRequest);
    await assignImageToGroup(this.graphqlRequest, img2, group1);

    // create dataset
    // ds1 (g1:w, g2:r, g3:r)
    const ds1 = await createDataset(this.graphqlRequest, {name: 'ds1', global: true});
    await assignDatasetToGroup(this.graphqlRequest, ds1, group1, true);
    // ds2 (g2:r, g3:w)
    const ds2 = await createDataset(this.graphqlRequest, {name: 'ds2'});
    await assignDatasetToGroup(this.graphqlRequest, ds2, group2, false);
    await assignDatasetToGroup(this.graphqlRequest, ds2, group3, true);
    // ds3 (g1:r. g2:r, g3:r)
    const ds3 = await createDataset(this.graphqlRequest, {name: 'ds3', launchGroupOnly: false});
    await assignDatasetToGroup(this.graphqlRequest, ds3, group3);
    // ds4 (g1:w. g2:w, g3:w)
    const ds4 = await createDataset(this.graphqlRequest, {name: 'ds4', launchGroupOnly: false});
    await assignDatasetToGroup(this.graphqlRequest, ds4, group3, true);
    // d5 (not accessible, because user is  not in group4)
    const ds5 = await createDataset(this.graphqlRequest, {name: 'ds5', launchGroupOnly: false});
    await assignDatasetToGroup(this.graphqlRequest, ds5, group4);

    // query by the user
    const result = await this.graphqlRequest(`
    query($where:UserWhereUniqueInput!) {
      user(where: $where) {
        id
        username
        effectiveGroups {
          id
          name
          instanceTypes {
            id
          }
          images {
            id
          }
          datasets {
            id
            writable
          }
        }
      }
    }`, {
      where: {
        id: user.id
      }
    });

    const groups = result.user.effectiveGroups;
    expect(groups).to.be.length(3);

    // g1
    let g = find(groups, {id: group1.id});

    expect(find(g.instanceTypes, {id: it1.id})).to.not.undefined;
    expect(find(g.instanceTypes, {id: it2.id})).to.not.undefined;

    expect(find(g.images, {id: img1.id})).to.not.undefined;
    expect(find(g.images, {id: img2.id})).to.not.undefined;

    expect(find(g.datasets, {id: ds1.id})).to.include({writable: true});
    expect(find(g.datasets, {id: ds2.id})).to.be.undefined;
    expect(find(g.datasets, {id: ds3.id})).to.include({writable: false});
    expect(find(g.datasets, {id: ds4.id})).to.include({writable: true});
    expect(find(g.datasets, {id: ds5.id})).to.be.undefined;

    // g2
    g = find(groups, {id: group2.id});

    expect(find(g.instanceTypes, {id: it1.id})).to.not.undefined;
    expect(find(g.instanceTypes, {id: it2.id})).to.be.undefined;

    expect(find(g.images, {id: img1.id})).to.not.undefined;
    expect(find(g.images, {id: img2.id})).to.be.undefined;

    expect(find(g.datasets, {id: ds1.id})).to.include({writable: false});
    expect(find(g.datasets, {id: ds2.id})).to.include({writable: false});
    expect(find(g.datasets, {id: ds3.id})).to.include({writable: false});
    expect(find(g.datasets, {id: ds4.id})).to.include({writable: true});
    expect(find(g.datasets, {id: ds5.id})).to.be.undefined;

    // g3
    g = find(groups, {id: group3.id});
    expect(find(g.datasets, {id: ds1.id})).to.include({writable: false});
    expect(find(g.datasets, {id: ds2.id})).to.include({writable: true});
    expect(find(g.datasets, {id: ds3.id})).to.include({writable: false});
    expect(find(g.datasets, {id: ds4.id})).to.include({writable: true});
    expect(find(g.datasets, {id: ds5.id})).to.be.undefined;
  });
});

async function createUser(graphqlRequest) {
  const userData = {
    username: faker.internet.userName().toLowerCase(),
    firstName: faker.name.firstName(),
    email: faker.internet.email().toLowerCase()
  };
  const data = await graphqlRequest(`
    mutation($data: UserCreateInput!){
      createUser (data: $data) { id username email}
    }`, {
    data: userData
  });
  return data.createUser;
}

async function createGroup(graphqlRequest, options= {}) {
  const data = {
    name: faker.internet.userName().toLowerCase(),
    ...options
  };
  const mutation = await graphqlRequest(`
    mutation ($data: GroupCreateInput!) {
    createGroup(data: $data) {
        id
      }
    }`, { data});
  const group1 = mutation.createGroup;
  return group1;
}

async function assignUserToGroup(graphqlRequest, user: any, group1: any) {
  await graphqlRequest(`
    mutation ($data: GroupUpdateInput!, $where: GroupWhereUniqueInput!) {
      updateGroup(data: $data, where: $where) {
        id
      }
    }`, {
    data: {
      users: {
        connect: [
          { id: user.id }
        ]
      }
    },
    where: {
      id: group1.id
    }
  });
}

async function createInstanceType(graphqlRequest, options= {}) {
  const data = {
    name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
    cpuLimit: 2,
    memoryLimit: 2,
    ...options,
  };
  const mutation = await graphqlRequest(`
  mutation($data: InstanceTypeCreateInput!){
    createInstanceType (data: $data) { id }
  }`, {
    data
  });

  return mutation.createInstanceType;
}

async function assignInstaceTypeToGroup(graphqlRequest, instanceType: any, group: any) {
  await graphqlRequest(`
    mutation ($data: InstanceTypeUpdateInput!, $where: InstanceTypeWhereUniqueInput!) {
      updateInstanceType(data: $data, where: $where) {
        id
      }
    }`, {
    data: {
      groups: {
        connect: [
          { id: group.id }
        ]
      }
    },
    where: {
      id: instanceType.id
    }
  });
}

async function createImage(graphqlRequest, options= {}) {
  const data = {
    name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
    ...options
  };
  const mutation = await graphqlRequest(`
  mutation($data: ImageCreateInput!){
    createImage (data: $data) { id }
  }`, {
    data
  });

  return mutation.createImage;
}

async function assignImageToGroup(graphqlRequest, image: any, group: any) {
  await graphqlRequest(`
    mutation ($data: ImageUpdateInput!, $where: ImageWhereUniqueInput!) {
      updateImage(data: $data, where: $where) {
        id
      }
    }`, {
    data: {
      groups: {
        connect: [
          { id: group.id }
        ]
      }
    },
    where: {
      id: image.id
    }
  });
}

async function createDataset(graphqlRequest, options= {}) {
  const data = {
    name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
    type: 'pv',
    pvProvisioning: 'manual',
    launchGroupOnly: true,
    ...options
  };
  const mutation = await graphqlRequest(`
  mutation($data: DatasetCreateInput!){
    createDataset (data: $data) { id }
  }`, {
    data
  });

  return mutation.createDataset;
}

async function assignDatasetToGroup(graphqlRequest, dataset: any, group: any, writable: boolean= false) {
  await graphqlRequest(`
    mutation ($data: DatasetUpdateInput!, $where: DatasetWhereUniqueInput!) {
      updateDataset(data: $data, where: $where) {
        id
      }
    }`, {
    data: {
      groups: {
        connect: [
          { id: group.id, writable }
        ]
      }
    },
    where: {
      id: dataset.id
    }
  });
}
