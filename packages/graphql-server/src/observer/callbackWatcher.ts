import { Crd } from '../resolvers/crd';
import CustomResourceNG from '../crdClient/customResourceNG';
import { isUndefined } from 'lodash';
import * as logger from '../logger';

export default class CallbackWatcher<T> {
  private crd: Crd<T>;
  private resource: CustomResourceNG<T>;
  private request: any;
  private dataOnChange: () => void;

  constructor({
    crd,
    resource,
    dataOnChange
  }: {
    crd: Crd<T>,
    resource: CustomResourceNG<T>,
    dataOnChange: () => void
  }) {
    this.crd = crd;
    this.resource = resource;
    this.dataOnChange = dataOnChange;
  }

  public watch = (options?: {rewatch?: boolean}) => {
    logger.info({
      component: logger.components.watcher,
      type: 'START',
      resource: this.resource.getResourcePlural()
    });
    this.request = this.resource.watch((type, object) => {
      // type could be ADDED, MODIFIED, DELETED
      const handler = async () => {
        logger.info({
          component: logger.components.watcher,
          type: `RESOURCE_${type}`,
          resource: this.resource.getResourcePlural(),
          name: object.metadata.name
        });

        this.dataOnChange();
      };

      handler()
        .catch(err => {
          logger.error({
            component: logger.components.watcher,
            resource: this.resource.getResourcePlural(),
            type: 'HANDLER_ERROR',
            name: object.metadata.name,
            stacktrace: err.stack,
            message: err.message
          });
        });
    }, err => {
      if (err) {
        logger.error({
          component: logger.components.watcher,
          resource: this.resource.getResourcePlural(),
          type: 'WATCH_ERROR',
          stacktrace: err.stack,
          message: err.message
        });
        return;
      }

      const rewatch = (options && !isUndefined(options.rewatch)) ? options.rewatch : true;
      if (rewatch) {
        this.watch(options);
      }
    });
  }

  public abort = () => {
    this.request.abort();
  }
}
