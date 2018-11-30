import CrdClient, { InstanceTypeSpec, DatasetSpec, ImageSpec } from '../crdClient/crdClientImpl';
import KeycloakAdmin from 'keycloak-admin';
import Watcher from './watcher';
import { crd as instanceType} from '../resolvers/instanceType';
import { crd as dataset} from '../resolvers/dataset';
import { crd as image} from '../resolvers/image';

export default class Observer {
  private datasetWatcher: Watcher<DatasetSpec>;
  private imageWatcher: Watcher<ImageSpec>;
  private instanceTypeWatcher: Watcher<InstanceTypeSpec>;

  constructor({
    crdClient,
    keycloakAdmin,
    everyoneGroupId,
    getAccessToken
  }: {
    crdClient: CrdClient,
    keycloakAdmin: KeycloakAdmin,
    everyoneGroupId: string,
    getAccessToken: () => Promise<string>;
  }) {
    this.datasetWatcher = new Watcher<DatasetSpec>({
      crd: dataset,
      resource: crdClient.datasets,
      keycloakAdmin,
      defaultCreateData: object => ({access: object.spec.access || 'everyone'}),
      everyoneGroupId,
      getAccessToken
    });

    this.imageWatcher = new Watcher<ImageSpec>({
      crd: image,
      resource: crdClient.images,
      keycloakAdmin,
      defaultCreateData: object => ({global: true}),
      everyoneGroupId,
      getAccessToken
    });

    this.instanceTypeWatcher = new Watcher<ImageSpec>({
      crd: instanceType,
      resource: crdClient.instanceTypes,
      keycloakAdmin,
      defaultCreateData: object => ({global: true}),
      everyoneGroupId,
      getAccessToken
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
