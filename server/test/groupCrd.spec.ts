// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import faker from 'faker';
import { cleaupAllCrd } from './sandbox';

chai.use(chaiHttp);

const expect = chai.expect;

// interface
declare module 'mocha' {
  // tslint:disable-next-line:interface-name
  interface ISuiteCallbackContext {
    graphqlRequest?: (query: string, variables?: any) => Promise<any>;
    createGroup?: any;
    currentGroup?: any;
  }
}

const resources = [{
  name: 'instanceType',
  pascal: 'InstanceType',
  plural: 'instanceTypes'
}, {
  name: 'dataset',
  pascal: 'Dataset',
  plural: 'datasets'
}, {
  name: 'image',
  pascal: 'Image',
  plural: 'images'
}];

describe('group resource relation graphql', function() {
  before(() => {
    this.graphqlRequest = (global as any).graphqlRequest;
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
  });

  after(async () => {
    await cleaupAllCrd();
  });

  resources.forEach(resource => {
    describe(`Resource ${resource.name}`, () => {
      it('should create resource with group', async () => {
        const resourceName = faker.internet.userName().toLowerCase().replace(/_/g, '-');
        const group = await this.createGroup();
        const mutation = await this.graphqlRequest(`
        mutation($data: ${resource.pascal}CreateInput!){
          create${resource.pascal} (data: $data) { id name groups {id name} }
        }`, {
          data: {
            name: resourceName,
            groups: {
              connect: [{id: group.id}]
            }
          }
        });

        // check mutation result
        expect(mutation[`create${resource.pascal}`]).to.deep.include({
          id: resourceName,
          name: resourceName,
          groups: [{id: group.id, name: group.name}]
        });

        // query one and check
        const query = await this.graphqlRequest(`
        query($where: ${resource.pascal}WhereUniqueInput!){
          ${resource.name} (where: $where) { id name groups {id name} }
        }`, {
          where: {id: resourceName}
        });
        expect(query[resource.name]).to.deep.include({
          id: resourceName,
          name: resourceName,
          groups: [{id: group.id, name: group.name}]
        });

        // connection with group should exist
        const groupQuery = await this.graphqlRequest(`
        query ($where: GroupWhereUniqueInput!) {
          group (where: $where) { id ${resource.plural} {id} }
        }`, {
          where: {id: group.id}
        });

        expect(groupQuery.group[resource.plural][0].id).to.be.equals(resourceName);
      });

      it('should list resource with group', async () => {
        // query one and check
        const query = await this.graphqlRequest(`
        query {
          ${resource.plural} { id name groups {id name} }
        }`);

        expect(query[resource.plural].length).to.be.least(1);
        expect(query[resource.plural][0].groups[0]).to.have.all.keys('id', 'name');
      });

      it('should update resource with connect/disconnect', async () => {
        const resourceName = faker.internet.userName().toLowerCase().replace(/_/g, '-');
        const firstGroup = await this.createGroup();
        await this.graphqlRequest(`
        mutation($data: ${resource.pascal}CreateInput!){
          create${resource.pascal} (data: $data) { id name groups {id name} }
        }`, {
          data: {
            name: resourceName,
            groups: {
              connect: [{id: firstGroup.id}]
            }
          }
        });

        // update
        const secGroup = await this.createGroup();
        const updateMutation = await this.graphqlRequest(`
        mutation($where: ${resource.pascal}WhereUniqueInput!, $data: ${resource.pascal}UpdateInput!){
          update${resource.pascal} (where: $where, data: $data) { id name groups {id name} }
        }`, {
          where: {
            id: resourceName
          },
          data: {
            groups: {
              connect: [{id: secGroup.id}],
              disconnect: [{id: firstGroup.id}]
            }
          }
        });

        // check mutation result
        expect(updateMutation[`update${resource.pascal}`]).to.deep.include({
          id: resourceName,
          name: resourceName,
          groups: [{id: secGroup.id, name: secGroup.name}]
        });

        // query and check
        const query = await this.graphqlRequest(`
        query($where: ${resource.pascal}WhereUniqueInput!){
          ${resource.name} (where: $where) { id name groups {id name} }
        }`, {
          where: {id: resourceName}
        });
        expect(query[resource.name]).to.deep.include({
          id: resourceName,
          name: resourceName,
          groups: [{id: secGroup.id, name: secGroup.name}]
        });
      });

      it('should delete resource', async () => {
        const resourceName = faker.internet.userName().toLowerCase().replace(/_/g, '-');
        const group = await this.createGroup();
        await this.graphqlRequest(`
        mutation($data: ${resource.pascal}CreateInput!){
          create${resource.pascal} (data: $data) { id name groups {id name} }
        }`, {
          data: {
            name: resourceName,
            groups: {
              connect: [{id: group.id}]
            }
          }
        });

        // delete
        await this.graphqlRequest(`
        mutation($where: ${resource.pascal}WhereUniqueInput!){
          delete${resource.pascal} (where: $where) { id }
        }`, {
          where: {id: resourceName}
        });

        // query one and check
        const query = await this.graphqlRequest(`
        query ($where: ${resource.pascal}WhereUniqueInput!) {
          ${resource.name} (where: $where) { id }
        }`, {
          where: {id: resourceName}
        });

        expect(query[resource.name]).to.be.null;

        // connection with group should not be exist
        const groupQuery = await this.graphqlRequest(`
        query ($where: GroupWhereUniqueInput!) {
          group (where: $where) { id ${resource.plural} {id} }
        }`, {
          where: {id: group.id}
        });

        expect(groupQuery.group[resource.plural]).to.be.eql([]);
      });
    });
  });
});
