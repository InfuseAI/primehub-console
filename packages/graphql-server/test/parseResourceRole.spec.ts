// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import { parseResourceRole, ResourceNamePrefix, ResourceRole } from '../src/resolvers/resourceRole';
import { defaultWorkspaceId } from '../src/resolvers/constant';

chai.use(chaiHttp);

const expect = chai.expect;

const fixtures: Array<{name: string, role: ResourceRole}> = [{
  name: 'img:assac',
  role: {
    rolePrefix: null,
    labels: null,
    workspaceId: defaultWorkspaceId,
    originalName: 'img:assac',
    resourcePrefix: ResourceNamePrefix.img,
    resourceName: 'assac'
  }
}, {
  name: 'it:assac',
  role: {
    rolePrefix: null,
    labels: null,
    workspaceId: defaultWorkspaceId,
    originalName: 'it:assac',
    resourcePrefix: ResourceNamePrefix.it,
    resourceName: 'assac'
  }
}, {
  name: 'it:ws|assac',
  role: {
    rolePrefix: null,
    labels: null,
    workspaceId: 'ws',
    originalName: 'it:ws|assac',
    resourcePrefix: ResourceNamePrefix.it,
    resourceName: 'assac'
  }
}, {
  name: 'ds:assac',
  role: {
    rolePrefix: null,
    labels: null,
    workspaceId: defaultWorkspaceId,
    originalName: 'ds:assac',
    resourcePrefix: ResourceNamePrefix.ds,
    resourceName: 'assac'
  }
}, {
  name: 'ds:rw:assac',
  role: {
    rolePrefix: null,
    labels: ['rw'],
    workspaceId: defaultWorkspaceId,
    originalName: 'ds:rw:assac',
    resourcePrefix: ResourceNamePrefix.ds,
    resourceName: 'assac'
  }
}, {
  name: 'ds:rw:ws|assac',
  role: {
    rolePrefix: null,
    labels: ['rw'],
    workspaceId: 'ws',
    originalName: 'ds:rw:ws|assac',
    resourcePrefix: ResourceNamePrefix.ds,
    resourceName: 'assac'
  }
}, {
  name: 'prefix:img:assac',
  role: {
    rolePrefix: 'prefix',
    labels: null,
    workspaceId: defaultWorkspaceId,
    originalName: 'prefix:img:assac',
    resourcePrefix: ResourceNamePrefix.img,
    resourceName: 'assac'
  }
}, {
  name: 'prefix:it:assac',
  role: {
    rolePrefix: 'prefix',
    labels: null,
    workspaceId: defaultWorkspaceId,
    originalName: 'prefix:it:assac',
    resourcePrefix: ResourceNamePrefix.it,
    resourceName: 'assac'
  }
}, {
  name: 'prefix:it:ws|assac',
  role: {
    rolePrefix: 'prefix',
    labels: null,
    workspaceId: 'ws',
    originalName: 'prefix:it:ws|assac',
    resourcePrefix: ResourceNamePrefix.it,
    resourceName: 'assac'
  }
}, {
  name: 'prefix:ds:assac',
  role: {
    rolePrefix: 'prefix',
    labels: null,
    workspaceId: defaultWorkspaceId,
    originalName: 'prefix:ds:assac',
    resourcePrefix: ResourceNamePrefix.ds,
    resourceName: 'assac'
  }
}, {
  name: 'prefix:ds:rw:assac',
  role: {
    rolePrefix: 'prefix',
    labels: ['rw'],
    workspaceId: defaultWorkspaceId,
    originalName: 'prefix:ds:rw:assac',
    resourcePrefix: ResourceNamePrefix.ds,
    resourceName: 'assac'
  }
}, {
  name: 'prefix:ds:rw:ws|assac',
  role: {
    rolePrefix: 'prefix',
    labels: ['rw'],
    workspaceId: 'ws',
    originalName: 'prefix:ds:rw:ws|assac',
    resourcePrefix: ResourceNamePrefix.ds,
    resourceName: 'assac'
  }
}, {
  name: 'gitlab',
  role: {
    rolePrefix: null,
    labels: null,
    workspaceId: null,
    originalName: 'gitlab',
    resourcePrefix: null,
    resourceName: null
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
