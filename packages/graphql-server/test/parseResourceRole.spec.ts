// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import { parseResourceRole, ResourceNamePrefix, ResourceRole } from '@infuseai/graphql-server/src/resourceRole';

chai.use(chaiHttp);

const expect = chai.expect;

const fixtures: Array<{name: string, role: ResourceRole}> = [{
  name: 'img:assac',
  role: {
    rolePrefix: null,
    resourcePrefix: ResourceNamePrefix.img,
    resourceName: 'assac'
  }
}, {
  name: 'it:assac',
  role: {
    rolePrefix: null,
    resourcePrefix: ResourceNamePrefix.it,
    resourceName: 'assac'
  }
}, {
  name: 'ds:assac',
  role: {
    rolePrefix: null,
    resourcePrefix: ResourceNamePrefix.ds,
    resourceName: 'assac'
  }
}, {
  name: 'ds:rw:assac',
  role: {
    rolePrefix: null,
    resourcePrefix: ResourceNamePrefix.ds,
    resourceName: 'rw:assac'
  }
}, {
  name: 'prefix:img:assac',
  role: {
    rolePrefix: 'prefix',
    resourcePrefix: ResourceNamePrefix.img,
    resourceName: 'assac'
  }
}, {
  name: 'prefix:it:assac',
  role: {
    rolePrefix: 'prefix',
    resourcePrefix: ResourceNamePrefix.it,
    resourceName: 'assac'
  }
}, {
  name: 'prefix:ds:assac',
  role: {
    rolePrefix: 'prefix',
    resourcePrefix: ResourceNamePrefix.ds,
    resourceName: 'assac'
  }
}, {
  name: 'prefix:ds:rw:assac',
  role: {
    rolePrefix: 'prefix',
    resourcePrefix: ResourceNamePrefix.ds,
    resourceName: 'rw:assac'
  }
}];

describe('observer', () => {
  it('should parse fixtures', () => {
    fixtures.forEach(fixture => {
      const role = parseResourceRole(fixture.name);
      expect(role).to.eql(fixture.role);
    });
  });
});
