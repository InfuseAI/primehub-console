// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import KeycloakAdminClient from 'keycloak-admin';
import { kubeConfig } from '../src/crdClient/crdClientImpl';
import * as k8s from '@kubernetes/client-node';

chai.use(chaiHttp);

const expect = chai.expect;

// utils
const groupFields = `
  id
  name`;

const generateResources = (groupId: string, groupName: string) => [
  {
    apiVersion: 'primehub.io/v1alpha1',
    kind: 'PhApplicationSpec',
    metadata: { name: 'app-test' },
    spec: {
      scope: 'group',
      displayName: 'my app',
      groupName,
      httpPort: 5000,
      instanceType: 'cpu-1',
      podTemplate: { spec: { containers: [{ name: 'foo', image: 'foo' }] } },
      svcTemplate: {
        spec: {
          ports: [
            { name: 'http', port: 5000, protocol: 'TCP', targetPort: 5000 },
          ],
        },
      },
    },
  },
  {
    apiVersion: 'primehub.io/v1alpha1',
    kind: 'PhJobSpec',
    metadata: { name: 'job-test' },
    spec: {
      command: 'x',
      displayName: 'x',
      userId: 'user-id',
      userName: 'user-name',
      groupId,
      groupName,
      image: 'image1',
      instanceType: 'instance1',
      activeDeadlineSeconds: 36000,
      ttlSecondsAfterFinished: 604800,
    },
  },
  {
    apiVersion: 'primehub.io/v1alpha1',
    kind: 'PhScheduleSpec',
    metadata: { name: 'schedule-test' },
    spec: {
      jobTemplate: {
        spec: {
          activeDeadlineSeconds: 86400,
          command: 'x',
          displayName: 'gogogo',
          userId: 'user-id',
          userName: 'user-name',
          groupId,
          groupName,
          image: 'pytorch-1.5.0',
          instanceType: 'cpu-1',
        },
      },
      recurrence: { type: 'inactive' },
    },
  },
  {
    apiVersion: 'primehub.io/v1alpha1',
    kind: 'PhDeploymentSpec',
    metadata: { name: 'deployment-test' },
    spec: {
      description: 'test',
      displayName: 'test',
      endpoint: { accessType: 'public', clients: [] },
      env: [],
      userId: 'user-id',
      userName: 'user-name',
      groupId,
      groupName,
      predictors: [
        {
          name: 'predictor1',
          instanceType: 'cpu-1',
          modelImage: 'infuseai/sklearn-prepackaged:v0.1.0',
          replicas: 1,
        },
      ],
    },
  },
];

// interface

declare module 'mocha' {
  // tslint:disable-next-line:interface-name
  interface ISuiteCallbackContext {
    graphqlRequest?: (query: string, variables?: any) => Promise<any>;
    kcAdminClient?: KeycloakAdminClient;
    currentGroup?: any;
  }
}

const createGroupResources = async (groupId: string, groupName: string) => {
  const resources: k8s.KubernetesObject[] = generateResources(
    groupId,
    groupName
  );
  for (const resource of resources) {
    const kind = resource.kind;
    const [apiGroup, apiVersion] = resource.apiVersion.split('/');
    const namespace = resource?.metadata?.namespace || 'default';
    const k8sClient = kubeConfig.makeApiClient(k8s.CustomObjectsApi);

    try {
      await k8sClient.createNamespacedCustomObject(
        apiGroup,
        apiVersion,
        namespace,
        kind.toLowerCase() + 's',
        resource
      );
    } catch (e) {
      console.log(e);
    }
  }
};

const expectGroupResourcesDeleted = async (
  groupId: string,
  groupName: string
) => {
  const resources: k8s.KubernetesObject[] = generateResources(
    groupId,
    groupName
  );
  for (const resource of resources) {
    const kind = resource.kind;
    const [apiGroup, apiVersion] = resource.apiVersion.split('/');
    const namespace = resource?.metadata?.namespace || 'default';
    const k8sClient = kubeConfig.makeApiClient(k8s.CustomObjectsApi);

    try {
      await k8sClient.getNamespacedCustomObject(
        apiGroup,
        apiVersion,
        namespace,
        kind.toLowerCase() + 's',
        resource.metadata.name
      );
      expect('should not be here').to.be.equals('i am here');
    } catch (err) {
      expect(err.statusCode).equals(404);
    }
  }
};

describe('group graphql for group resources deletion', () => {
  before(async () => {
    this.graphqlRequest = (global as any).graphqlRequest;
    this.kcAdminClient = (global as any).kcAdminClient;
    await (global as any).authKcAdmin();
  });

  it('should add a group', async () => {
    const groupData = {
      // name: faker.internet.userName().toLowerCase(),
      name: 'group-name',
    };
    const data = await this.graphqlRequest(
      `
    mutation($data: GroupCreateInput!){
      createGroup (data: $data) { ${groupFields} }
    }`,
      {
        data: groupData,
      }
    );

    expect(data.createGroup).to.be.deep.include({
      name: groupData.name,
    });
    this.currentGroup = data.createGroup;
  });

  it('should get group resource counts to be deleted', async () => {
    await createGroupResources(this.currentGroup.id, this.currentGroup.name);
    const data = await this.graphqlRequest(
      `
    query ($where: GroupWhereUniqueInput!){
      groupResourcesToBeDeleted(where: $where) {
        apps
        jobs
        schedules
        deployments
      }
    }
    `,
      {
        where: { id: this.currentGroup.id },
      }
    );
    expect(data.groupResourcesToBeDeleted.apps).to.equals(1);
    expect(data.groupResourcesToBeDeleted.jobs).to.equals(1);
    expect(data.groupResourcesToBeDeleted.schedules).to.equals(1);
    expect(data.groupResourcesToBeDeleted.deployments).to.equals(1);
  });

  it('should delete a group', async () => {
    await this.graphqlRequest(
      `
    mutation($where: GroupWhereUniqueInput!){
      deleteGroup (where: $where) { id }
    }`,
      {
        where: { id: this.currentGroup.id },
      }
    );

    // query
    const data = await this.graphqlRequest(
      `
    query ($where: GroupWhereUniqueInput!) {
      group (where: $where) { ${groupFields} }
    }`,
      {
        where: { id: this.currentGroup.id },
      }
    );

    expect(data.group).to.be.null;
    expectGroupResourcesDeleted(this.currentGroup.id, this.currentGroup.name);
  });
});
