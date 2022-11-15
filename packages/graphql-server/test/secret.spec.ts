// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import faker from 'faker';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import {GITSYNC_PREFIX, IMAGE_PREFIX, PASSWORD_HOLDER} from '../src/k8sResource/k8sSecret';

chai.use(chaiHttp);

const expect = chai.expect;

// utils
const fields = `
  id
  name
  displayName
  type
  secret
  registryHost
  username
  password
`;

const toBase64 = (str: string) => Buffer.from(str).toString('base64');
const encodeConfig = (registryHost: string, username: string, password: string) => toBase64(
  JSON.stringify({
    auths: {[registryHost]: {auth: toBase64(`${username}:${password}`)}}
  })
);

// interface

declare module 'mocha' {
  // tslint:disable-next-line:interface-name
  interface ISuiteCallbackContext {
    graphqlRequest?: (query: string, variables?: any) => Promise<any>;
    kcAdminClient?: KeycloakAdminClient;
    k8sClient?: any;
    currentOpaqueSecretName?: string;
    currentDockerSecretName?: string;
  }
}

describe('secret graphql', function() {
  before(async () => {
    this.graphqlRequest = (global as any).graphqlRequest;
    this.kcAdminClient = (global as any).kcAdminClient;
    this.k8sClient = (global as any).corev1KubeClient;
    // clean up first
    const {body: {items}} = await this.k8sClient.listNamespacedSecret('default');
    for (const secret of items) {
      if (secret.metadata.name.startsWith(GITSYNC_PREFIX) || secret.metadata.name.startsWith(IMAGE_PREFIX)) {
        await this.k8sClient.deleteNamespacedSecret(secret.metadata.name, 'default');
      }
    }
    await (global as any).authKcAdmin();
  });

  it('should create opaque secret', async () => {
    const data = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      displayName: faker.internet.userName(),
      type: 'opaque',
      secret: 'secret'
    };
    await this.graphqlRequest(`
    mutation($data: SecretCreateInput!){
      createSecret (data: $data) { ${fields} }
    }`, {
      data
    });

    // query
    const {secrets} = await this.graphqlRequest(`{
      secrets {${fields}}
    }`);

    expect(secrets.length).to.be.least(1);
    expect(secrets[0].name).to.be.equals(data.name);
    expect(secrets[0].displayName).to.be.equals(data.displayName);
    expect(secrets[0].type).to.be.equals(data.type);
    expect(secrets[0].secret).to.be.eql(PASSWORD_HOLDER);

    this.currentOpaqueSecretName = secrets[0].id;

    const k8sResource =
      await this.k8sClient.readNamespacedSecret(this.currentOpaqueSecretName, 'default')
    expect(k8sResource.body.data.ssh).to.be.equals(
      Buffer.from(data.secret).toString('base64')
    );
  });

  it('should find one opaque secret', async () => {
    // query
    const {secret} = await this.graphqlRequest(`{
      secret(where: {id: "${this.currentOpaqueSecretName}"}) {${fields}}
    }`);

    expect(secret.id).to.be.equals(this.currentOpaqueSecretName);
    expect(secret.type).to.be.equals('opaque');
    expect(secret.secret).to.be.eql(PASSWORD_HOLDER);
  });

  it('should update opaque secret with new secret', async () => {
    const newSecret = 'new secret';
    await this.graphqlRequest(`
    mutation($data: SecretUpdateInput!){
      updateSecret (where: {id: "${this.currentOpaqueSecretName}"}, data: $data) { ${fields} }
    }`, {
      data: {secret: newSecret}
    });

    const {secret} = await this.graphqlRequest(`{
      secret(where: {id: "${this.currentOpaqueSecretName}"}) {${fields}}
    }`);

    expect(secret.id).to.be.equals(this.currentOpaqueSecretName);
    expect(secret.type).to.be.equals('opaque');
    expect(secret.secret).to.be.eql(PASSWORD_HOLDER);

    // test k8s
    const k8sResource =
      await this.k8sClient.readNamespacedSecret(this.currentOpaqueSecretName, 'default')
    expect(k8sResource.body.data.ssh).to.be.equals(
      Buffer.from(newSecret).toString('base64')
    );
  });

  it('should create dockerconfigjson secret', async () => {
    const data = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      displayName: faker.internet.userName(),
      type: 'kubernetes',
      username: 'username',
      password: 'password',
      registryHost: 'registryHost'
    };
    await this.graphqlRequest(`
    mutation($data: SecretCreateInput!){
      createSecret (data: $data) { ${fields} }
    }`, {
      data
    });

    // query all
    const {secrets} = await this.graphqlRequest(`{
      secrets {${fields}}
    }`);

    expect(secrets.length).to.be.equals(2);

    // find only dockerconfigjson
    const {secrets: dockerConfigSecrets} = await this.graphqlRequest(`{
      secrets(where: {ifDockerConfigJson: true}) {${fields}}
    }`);

    expect(dockerConfigSecrets.length).to.be.equals(1);
    expect(dockerConfigSecrets[0].name).to.be.equals(data.name);
    expect(dockerConfigSecrets[0].displayName).to.be.equals(data.displayName);
    expect(dockerConfigSecrets[0].type).to.be.equals(data.type);
    expect(dockerConfigSecrets[0].registryHost).to.be.equals(data.registryHost);
    expect(dockerConfigSecrets[0].username).to.be.equals(data.username);
    expect(dockerConfigSecrets[0].password).to.be.eql(PASSWORD_HOLDER);

    this.currentDockerSecretName = dockerConfigSecrets[0].id;

    const k8sResource =
      await this.k8sClient.readNamespacedSecret(this.currentDockerSecretName, 'default')
    expect(k8sResource.body.data['.dockerconfigjson']).to.be.equals(
      encodeConfig(data.registryHost, data.username, data.password)
    );
  });

  it('should find one dockerconfigjson secret', async () => {
    // query
    const {secret} = await this.graphqlRequest(`{
      secret(where: {id: "${this.currentDockerSecretName}"}) {${fields}}
    }`);

    expect(secret.id).to.be.equals(this.currentDockerSecretName);
  });

  it('should update dockerconfigjson secret with new config', async () => {
    // todo: fix this variable dependency from last test
    const oldRegistryHost = 'registryHost';
    const data = {
      username: 'newusername',
      password: 'newpassword'
    };

    await this.graphqlRequest(`
    mutation($data: SecretUpdateInput!){
      updateSecret (where: {id: "${this.currentDockerSecretName}"}, data: $data) { ${fields} }
    }`, {
      data
    });

    const {secret} = await this.graphqlRequest(`{
      secret(where: {id: "${this.currentDockerSecretName}"}) {${fields}}
    }`);

    expect(secret.id).to.be.equals(this.currentDockerSecretName);
    expect(secret.type).to.be.equals('kubernetes');
    expect(secret.username).to.be.equals(data.username);
    expect(secret.password).to.be.eql(PASSWORD_HOLDER);
    expect(secret.registryHost).to.be.equals(oldRegistryHost);

    // test k8s
    const k8sResource =
      await this.k8sClient.readNamespacedSecret(this.currentDockerSecretName, 'default')
    expect(k8sResource.body.data['.dockerconfigjson']).to.be.equals(
      encodeConfig(oldRegistryHost, data.username, data.password)
    );
  });

  it('should create and update image with dockerconfigjson image', async () => {
    const data = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      useImagePullSecret: this.currentDockerSecretName
    };
    const mutation = await this.graphqlRequest(`
    mutation($data: ImageCreateInput!){
      createImage (data: $data) { id useImagePullSecret }
    }`, {
      data
    });

    expect(mutation.createImage.useImagePullSecret).to.be.eql(this.currentDockerSecretName);

    await this.graphqlRequest(`
    mutation($data: ImageUpdateInput!){
      updateImage (where: {id: "${mutation.createImage.id}"}, data: $data) { id useImagePullSecret }
    }`, {
      data: {
        useImagePullSecret: null
      }
    });

    // query
    const queryOne = await this.graphqlRequest(`
    query($where: ImageWhereUniqueInput!){
      image (where: $where) { id, useImagePullSecret }
    }`, {
      where: {id: mutation.createImage.id}
    });

    expect(queryOne.image.useImagePullSecret).to.be.null;
  });
});
