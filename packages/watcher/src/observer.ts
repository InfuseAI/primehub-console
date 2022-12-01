// tslint:disable-next-line:max-line-length
import CrdClient, { InstanceTypeSpec, DatasetSpec, ImageSpec } from '@infuseai/graphql-server/lib/crdClient/crdClientImpl';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import Watcher from './watcher';
import { crd as instanceType} from '@infuseai/graphql-server/lib/resolvers/instanceType';
import { crd as dataset} from '@infuseai/graphql-server/lib/resolvers/dataset';
import { crd as image} from '@infuseai/graphql-server/lib/resolvers/image';

export default class Observer {
  private datasetWatcher: Watcher<DatasetSpec>;
  private imageWatcher: Watcher<ImageSpec>;
  private instanceTypeWatcher: Watcher<InstanceTypeSpec>;

  constructor({
    crdClient,
    keycloakAdmin,
    everyoneGroupId,
    getAccessToken,
    k8sCrdNamespace
  }: {
    crdClient: CrdClient,
    keycloakAdmin: KeycloakAdminClient,
    everyoneGroupId: string,
    getAccessToken: () => Promise<string>;
    k8sCrdNamespace: string
  }) {
    this.datasetWatcher = new Watcher<DatasetSpec>({
      crd: dataset,
      resource: crdClient.datasets,
      keycloakAdmin,
      defaultCreateData: object => ({global: false}),
      everyoneGroupId,
      getAccessToken,
      k8sCrdNamespace
    });

    this.imageWatcher = new Watcher<ImageSpec>({
      crd: image,
      resource: crdClient.images,
      keycloakAdmin,
      defaultCreateData: object => ({global: false}),
      everyoneGroupId,
      getAccessToken,
      k8sCrdNamespace
    });

    this.instanceTypeWatcher = new Watcher<ImageSpec>({
      crd: instanceType,
      resource: crdClient.instanceTypes,
      keycloakAdmin,
      defaultCreateData: object => ({global: false}),
      everyoneGroupId,
      getAccessToken,
      k8sCrdNamespace
    });
  }

  public observe(options?: {rewatch?: boolean}) {
    this.datasetWatcher.watch(options);
    this.imageWatcher.watch(options);
    this.instanceTypeWatcher.watch(options);
  }

  public abort() {
    this.datasetWatcher.abort();
    this.imageWatcher.abort();
    this.instanceTypeWatcher.abort();
  }
}
