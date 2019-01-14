// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import faker from 'faker';
import KeycloakAdminClient from 'keycloak-admin';
import moment from 'moment';
import { cleanupAnns } from './sandbox';
import { omit, times } from 'lodash';
import BPromise from 'bluebird';

chai.use(chaiHttp);

const expect = chai.expect;

// utils
const annFields = `
  id
  title
  content {html}
  expirationTimestamp
  sendEmail
  status
  global
  spec
  groups {
    id
    name
  }
`;

const userWithAnn = (userId: string) => `
  user(where: {id: "${userId}"}) {
    id
    username
    announcements {
      id
      title
      content
      expirationTimestamp
    }
  }
`;

const parseToDefaultFormat = (isoDate: string) => {
  return moment.utc(isoDate).format(moment.defaultFormatUtc);
};

// interface
declare module 'mocha' {
  // tslint:disable-next-line:interface-name
  interface ISuiteCallbackContext {
    graphqlRequest?: (query: string, variables?: any) => Promise<any>;
    httpRequester?: ChaiHttp.Agent;
    kcAdminClient?: KeycloakAdminClient;
    createGroup?: any;
    createUser?: any;
    currentAnn?: any;
  }
}

describe('announcement graphql', function() {
  before(async () => {
    this.graphqlRequest = (global as any).graphqlRequest;
    this.kcAdminClient = (global as any).kcAdminClient;
    this.httpRequester = (global as any).httpRequester;
    this.createGroup = async () => {
      const data = await this.graphqlRequest(`
      mutation($data: GroupCreateInput!){
        createGroup (data: $data) { id name }
      }`, {
        data: {
          name: faker.internet.userName().toLowerCase()
        }
      });
      return data.createGroup;
    };
    await (global as any).authKcAdmin();
  });

  this.createUser = async () => {
    const data = await this.graphqlRequest(`
    mutation($data: UserCreateInput!){
      createUser (data: $data) { id username }
    }`, {
      data: {
        username: faker.internet.userName().toLowerCase(),
        email: faker.internet.email().toLowerCase()
      }
    });
    return data.createUser;
  };

  afterEach(async () => {
    await cleanupAnns();
  });

  it('should expect empty announcements when query', async () => {
    const data = await this.graphqlRequest(`{
      announcements {${annFields}}
    }`);
    expect(data.announcements.length).to.be.least(0);
  });

  it('should create announcement with minimum data', async () => {
    const annData = {
      title: faker.lorem.slug(),
      content: {html: `<p>${faker.lorem.sentences()}</p>`},
      expirationTimestamp: moment.utc().add(1, 'w').toISOString()
    };
    const data = await this.graphqlRequest(`
    mutation($data: AnnouncementCreateInput!){
      createAnnouncement (data: $data) { ${annFields} }
    }`, {
      data: annData
    });

    expect(data.createAnnouncement).to.be.deep.include({
      ...annData,
      expirationTimestamp: parseToDefaultFormat(annData.expirationTimestamp),
      status: 'draft',
      sendEmail: false,
      global: true,
      groups: []
    });

    // query one
    const queryOne = await this.graphqlRequest(`
    query ($where: AnnouncementWhereUniqueInput!) {
      announcement (where: $where) { ${annFields} }
    }`, {
      where: {id: data.createAnnouncement.id}
    });

    expect(queryOne.announcement).to.be.deep.equal(data.createAnnouncement);

    // list
    const listQuery = await this.graphqlRequest(`
    query {
      announcements { ${annFields} }
    }`);

    expect(listQuery.announcements[0]).to.be.deep.equal(data.createAnnouncement);

    // user ann
    const {users} = await this.graphqlRequest(`
    query {
      users { id }
    }`);

    const userQuery = await this.graphqlRequest(`
    query {
      ${userWithAnn(users[0].id)}
    }`);
    expect(userQuery.user.announcements.length).to.be.equal(0);
  });

  it('should create announcement with global=true & published & sendEmail=true', async () => {
    const annData = {
      title: faker.lorem.slug(),
      content: {html: `<p>${faker.lorem.sentences()}</p>`},
      expirationTimestamp: moment.utc().add(1, 'w').toISOString(),
      global: true,
      sendEmail: true,
      status: 'published'
    };
    const data = await this.graphqlRequest(`
    mutation($data: AnnouncementCreateInput!){
      createAnnouncement (data: $data) { ${annFields} }
    }`, {
      data: annData
    });

    expect(data.createAnnouncement).to.be.deep.include({
      ...annData,
      expirationTimestamp: parseToDefaultFormat(annData.expirationTimestamp),
      groups: []
    });

    // query one
    const queryOne = await this.graphqlRequest(`
    query ($where: AnnouncementWhereUniqueInput!) {
      announcement (where: $where) { ${annFields} }
    }`, {
      where: {id: data.createAnnouncement.id}
    });

    expect(queryOne.announcement).to.be.deep.equal(data.createAnnouncement);

    // list
    const listQuery = await this.graphqlRequest(`
    query {
      announcements { ${annFields} }
    }`);

    expect(listQuery.announcements[0]).to.be.deep.equal(data.createAnnouncement);

    // user ann
    const {users} = await this.graphqlRequest(`
    query {
      users { id }
    }`);

    const userQuery = await this.graphqlRequest(`
    query {
      ${userWithAnn(users[0].id)}
    }`);
    expect(userQuery.user.announcements.length).to.be.equal(1);
    expect(userQuery.user.announcements[0]).to.be.deep.equal({
      id: data.createAnnouncement.id,
      title: data.createAnnouncement.title,
      content: data.createAnnouncement.content.html,
      expirationTimestamp: parseToDefaultFormat(data.createAnnouncement.expirationTimestamp)
    });
  });

  it('should create announcement with groups', async () => {
    const group = await this.createGroup();
    const annData = {
      title: faker.lorem.slug(),
      content: {html: `<p>${faker.lorem.sentences()}</p>`},
      expirationTimestamp: moment.utc().add(1, 'w').toISOString(),
      sendEmail: true,
      status: 'published',
      groups: {connect: [{id: group.id}]}
    };
    const data = await this.graphqlRequest(`
    mutation($data: AnnouncementCreateInput!){
      createAnnouncement (data: $data) { ${annFields} }
    }`, {
      data: annData
    });

    expect(data.createAnnouncement).to.be.deep.include({
      ...annData,
      expirationTimestamp: parseToDefaultFormat(annData.expirationTimestamp),
      groups: [{id: group.id, name: group.name}]
    });
  });

  it('should update announcement', async () => {
    const group = await this.createGroup();
    const annData = {
      title: faker.lorem.slug(),
      content: {html: `<p>${faker.lorem.sentences()}</p>`},
      expirationTimestamp: moment.utc().add(1, 'w').toISOString(),
      global: true,
      status: 'draft'
    };
    const data = await this.graphqlRequest(`
    mutation($data: AnnouncementCreateInput!){
      createAnnouncement (data: $data) { ${annFields} }
    }`, {
      data: annData
    });

    // update
    const delta = {
      expirationTimestamp: moment.utc().add(2, 'w').toISOString(),
      global: false,
      groups: {connect: [{id: group.id}]}
    };
    await this.graphqlRequest(`
    mutation($data: AnnouncementUpdateInput!){
      updateAnnouncement (where: {id: "${data.createAnnouncement.id}"}, data: $data) { ${annFields} }
    }`, {
      data: delta
    });

    // update and publish
    const group2 = await this.createGroup();
    const delta2 = {
      title: faker.lorem.slug(),
      global: false,
      status: 'published',
      groups: {disconnect: [{id: group.id}], connect: [{id: group2.id}]}
    };
    await this.graphqlRequest(`
    mutation($data: AnnouncementUpdateInput!){
      updateAnnouncement (where: {id: "${data.createAnnouncement.id}"}, data: $data) { ${annFields} }
    }`, {
      data: delta2
    });

    const expectedData = {
      // dont check spec for now
      ...omit(data.createAnnouncement, 'spec'),
      ...delta,
      ...delta2,
      expirationTimestamp: parseToDefaultFormat(delta.expirationTimestamp),
      groups: [{id: group2.id, name: group2.name}]
    };
    const queryOne = await this.graphqlRequest(`
    query ($where: AnnouncementWhereUniqueInput!) {
      announcement (where: $where) { ${annFields} }
    }`, {
      where: {id: data.createAnnouncement.id}
    });
    expect(queryOne.announcement).to.be.deep.include(expectedData);
  });

  it('should delete announcement', async () => {
    const annData = {
      title: faker.lorem.slug(),
      content: {html: `<p>${faker.lorem.sentences()}</p>`},
      expirationTimestamp: moment.utc().add(1, 'w').toISOString(),
      global: true,
      status: 'draft'
    };
    const data = await this.graphqlRequest(`
    mutation($data: AnnouncementCreateInput!){
      createAnnouncement (data: $data) { ${annFields} }
    }`, {
      data: annData
    });

    // delete announcement
    await this.graphqlRequest(`
    mutation {
      deleteAnnouncement (where: {id: "${data.createAnnouncement.id}"}) { ${annFields} }
    }`);

    const queryOne = await this.graphqlRequest(`
    query ($where: AnnouncementWhereUniqueInput!) {
      announcement (where: $where) { ${annFields} }
    }`, {
      where: {id: data.createAnnouncement.id}
    });
    expect(queryOne.announcement).to.be.null;
  });

  it('should expect user to get global announcements', async () => {
    // create global ann
    const globalAnnData = {
      title: faker.lorem.slug(),
      content: {html: `<p>${faker.lorem.sentences()}</p>`},
      expirationTimestamp: moment.utc().add(1, 'w').toISOString(),
      global: true,
      status: 'published'
    };
    const {createAnnouncement: globalAnn} = await this.graphqlRequest(`
    mutation($data: AnnouncementCreateInput!){
      createAnnouncement (data: $data) { ${annFields} }
    }`, {
      data: globalAnnData
    });

    // create group ann
    const group = await this.createGroup();
    const groupAnnData = {
      title: faker.lorem.slug(),
      content: {html: `<p>${faker.lorem.sentences()}</p>`},
      expirationTimestamp: moment.utc().add(1, 'w').toISOString(),
      status: 'published',
      groups: {connect: [{id: group.id}]}
    };
    await this.graphqlRequest(`
    mutation($data: AnnouncementCreateInput!){
      createAnnouncement (data: $data) { ${annFields} }
    }`, {
      data: groupAnnData
    });

    // user ann
    const {users} = await this.graphqlRequest(`
    query {
      users { id }
    }`);

    // should only get global ann
    const userQuery = await this.graphqlRequest(`
    query {
      ${userWithAnn(users[0].id)}
    }`);
    expect(userQuery.user.announcements.length).to.be.equal(1);
    expect(userQuery.user.announcements[0].id).to.be.equal(globalAnn.id);
  });

  it('should expect user to get global announcements', async () => {
    // create global ann
    const globalAnnData = {
      title: faker.lorem.slug(),
      content: {html: `<p>${faker.lorem.sentences()}</p>`},
      expirationTimestamp: moment.utc().add(1, 'w').toISOString(),
      global: true,
      status: 'published'
    };
    const {createAnnouncement: globalAnn} = await this.graphqlRequest(`
    mutation($data: AnnouncementCreateInput!){
      createAnnouncement (data: $data) { ${annFields} }
    }`, {
      data: globalAnnData
    });

    // delay for a sec to make announcement have order
    await BPromise.delay(1000);

    // create group ann
    const group = await this.createGroup();
    const groupAnnData = {
      title: faker.lorem.slug(),
      content: {html: `<p>${faker.lorem.sentences()}</p>`},
      expirationTimestamp: moment.utc().add(1, 'w').toISOString(),
      status: 'published',
      groups: {connect: [{id: group.id}]}
    };
    const {createAnnouncement: groupAnn} = await this.graphqlRequest(`
    mutation($data: AnnouncementCreateInput!){
      createAnnouncement (data: $data) { ${annFields} }
    }`, {
      data: groupAnnData
    });

    // user ann
    const {users} = await this.graphqlRequest(`
    query {
      users { id }
    }`);

    // add user to group
    const userId = users[0].id;
    await this.graphqlRequest(`
    mutation($where: GroupWhereUniqueInput!, $data: GroupUpdateInput!){
      updateGroup (where: $where, data: $data) { id name users {id} }
    }`, {
      where: {id: group.id},
      data: {
        users: {connect: [{id: userId}]}
      }
    });

    // should only get global ann
    const userQuery = await this.graphqlRequest(`
    query {
      ${userWithAnn(userId)}
    }`);
    expect(userQuery.user.announcements.length).to.be.equal(2);
    // latest on top
    expect(userQuery.user.announcements[0].id).to.be.equal(groupAnn.id);
    expect(userQuery.user.announcements[1].id).to.be.equal(globalAnn.id);
  });

  it('should update user announcementReadTimestamp', async () => {
    // create five global ann
    await BPromise.mapSeries(
      times(5, index => {
        return {
          title: faker.lorem.slug(),
          content: {html: `<p>${faker.lorem.sentences()}</p>`},
          expirationTimestamp: moment.utc().add(1, 'w').add(index + 1, 'd').toISOString(),
          global: true,
          status: 'published'
        };
      }),
      async annData => {
        await this.graphqlRequest(`
        mutation($data: AnnouncementCreateInput!){
          createAnnouncement (data: $data) { ${annFields} }
        }`, {
          data: annData
        });
      }
    );

    // user ann
    const {users} = await this.graphqlRequest(`
    query {
      users { id }
    }`);

    const userQuery = await this.graphqlRequest(`
    query {
      ${userWithAnn(users[0].id)}
    }`);
    expect(userQuery.user.announcements.length).to.be.equal(5);

    // update announcementReadTimestamp to the third one
    const thirdAnnExpTime = userQuery.user.announcements[2].expirationTimestamp;
    const request = this.httpRequester.post(`/users/${users[0].id}/last-read-time`);
    request.set('Authorization', `Bearer ${process.env.SHARED_GRAPHQL_SECRET_KEY}`);
    const res = await request.send({
      time: moment.utc(thirdAnnExpTime).unix()
    });
    expect(res).to.have.status(200);

    // fetch again
    const userQueryAgain = await this.graphqlRequest(`
    query {
      ${userWithAnn(users[0].id)}
    }`);
    expect(userQueryAgain.user.announcements.length).to.be.equal(2);
  });
});
