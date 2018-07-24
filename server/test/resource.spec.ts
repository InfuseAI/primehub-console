// tslint:disable:no-unused-expression
import * as chai from 'chai';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import CustomResource from '../src/crdClient/customResource';
import kubeClient from 'kubernetes-client';
const Client = (kubeClient as any).Client;
const config = (kubeClient as any).config;
const client = new Client({ config: config.fromKubeconfig(), version: '1.9' });

const expect = chai.expect;

// prepare crd json
const crd = yaml.safeLoad(fs.readFileSync(path.resolve(__dirname, './fixtures/container.yaml'), 'utf8'));

interface Container {
  'limits.cpu'?: number;
  'limits.memory'?: string;
  'requests.cpu'?: number;
  'requests.memory'?: string;
}

declare module 'mocha' {
  // tslint:disable-next-line:interface-name
  interface ISuiteCallbackContext {
    currentResource: CustomResource<Container>;
  }
}

describe('Resource', function() {
  before(async () => {
    // Create the CRD with the Kubernetes API
    const create = await client.apis['apiextensions.k8s.io'].v1beta1.crd.post({ body: crd });
    // console.log('Create: ', create);
    // Add endpoints to our client
    this.currentResource = new CustomResource(client, crd);
  });

  after(async () => {
    // delete the CRD
    await client.apis['apiextensions.k8s.io'].v1beta1.crd.delete(crd.metadata.name);
  });

  it('should list and expecting empty', async () => {
    const resources = await this.currentResource.list();
    expect(resources).to.be.eql([]);
  });

  it('should create', async () => {
    const spec = {
      'limits.cpu': 3.0,
      'limits.memory': '12G',
      'requests.cpu': 1.5,
      'requests.memory': '8G'
    };
    const metadata = {
      name: 'cpu-only',
      description: 'CPU Only'
    };
    const res = await this.currentResource.create(metadata, spec);
    expect(res.spec).to.be.eql(spec);
    expect(res.metadata).to.include(metadata);

    // check list
    const items = await this.currentResource.list();
    expect(items.length).to.be.eql(1);
    expect(items[0].spec).to.be.eql(spec);
    expect(items[0].metadata).to.include(metadata);
  });

  it('should get', async () => {
    const item = await this.currentResource.get('cpu-only');
    expect(item).to.be.ok;
  });

  it('should update', async () => {
    const spec = {'limits.cpu': 5.0};
    const metadata = {description: 'another description'};
    const res = await this.currentResource.patch('cpu-only', {
      metadata,
      spec
    });
    expect(res.spec).to.include(spec);
    expect(res.metadata).to.include(metadata);

    // double-check with get
    const item = await this.currentResource.get('cpu-only');
    expect(item.spec).to.include(spec);
    expect(item.metadata).to.include(metadata);
  });

  it('should delete', async () => {
    await this.currentResource.del('cpu-only');
  });
});
