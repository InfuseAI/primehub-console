import CrdClient, { InstanceTypeSpec, ImageSpec } from '../crdClient/crdClientImpl';
import CallbackWatcher from './callbackWatcher';
import { crd as instanceType} from '../resolvers/instanceType';
import { crd as image} from '../resolvers/image';

export default class Observer {
  private imageWatcher: CallbackWatcher<ImageSpec>;
  private instanceTypeWatcher: CallbackWatcher<InstanceTypeSpec>;

  constructor({
    crdClient,
    imageOnChange,
    instanceTypeOnChange
  }: {
    crdClient: CrdClient,
    imageOnChange: () => void,
    instanceTypeOnChange: () => void
  }) {
    this.imageWatcher = new CallbackWatcher<ImageSpec>({
      crd: image,
      resource: crdClient.images,
      dataOnChange: imageOnChange
    });

    this.instanceTypeWatcher = new CallbackWatcher<ImageSpec>({
      crd: instanceType,
      resource: crdClient.instanceTypes,
      dataOnChange: instanceTypeOnChange
    });
  }

  public observe(options?: {rewatch?: boolean}) {
    this.imageWatcher.watch(options);
    this.instanceTypeWatcher.watch(options);
  }

  public abort() {
    this.imageWatcher.abort();
    this.instanceTypeWatcher.abort();
  }
}
