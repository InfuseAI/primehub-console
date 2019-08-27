// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import { parseResourceRole, ResourceNamePrefix, ResourceRole } from '../src/resolvers/resourceRole';

chai.use(chaiHttp);

const expect = chai.expect;

const fixtures: Array<{name: string, role: ResourceRole}> = [{
  name: 'img:assac',
  role: {
    rolePrefix: null,
    originalName: 'img:assac',
    resourcePrefix: ResourceNamePrefix.img,
    resourceName: 'assac'
  }
}, {
  name: 'it:assac',
  role: {
    rolePrefix: null,
    originalName: 'it:assac',
    resourcePrefix: ResourceNamePrefix.it,
    resourceName: 'assac'
  }
}, {
  name: 'ds:assac',
  role: {
    rolePrefix: null,
    originalName: 'ds:assac',
    resourcePrefix: ResourceNamePrefix.ds,
    resourceName: 'assac'
  }
}, {
  name: 'ds:rw:assac',
  role: {
    rolePrefix: null,
    originalName: 'ds:rw:assac',
    resourcePrefix: ResourceNamePrefix.ds,
    resourceName: 'rw:assac'
  }
}, {
  name: 'prefix:img:assac',
  role: {
    rolePrefix: 'prefix',
    originalName: 'prefix:img:assac',
    resourcePrefix: ResourceNamePrefix.img,
    resourceName: 'assac'
  }
}, {
  name: 'prefix:it:assac',
  role: {
    rolePrefix: 'prefix',
    originalName: 'prefix:it:assac',
    resourcePrefix: ResourceNamePrefix.it,
    resourceName: 'assac'
  }
}, {
  name: 'prefix:ds:assac',
  role: {
    rolePrefix: 'prefix',
    originalName: 'prefix:ds:assac',
    resourcePrefix: ResourceNamePrefix.ds,
    resourceName: 'assac'
  }
}, {
  name: 'prefix:ds:rw:assac',
  role: {
    rolePrefix: 'prefix',
    originalName: 'prefix:ds:rw:assac',
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
