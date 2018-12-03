import KeycloakAdmin from 'keycloak-admin';
import { Crd } from '../resolvers/crd';
import CustomResource from '../crdClient/customResource';
import { isUndefined } from 'lodash';
import * as logger from '../logger';

export default class Watcher<T> {
  private crd: Crd<T>;
  private resource: CustomResource<T>;
  private keycloakAdmin: KeycloakAdmin;
  private defaultCreateData: any;
  private everyoneGroupId: string;
  private request: any;
  private getAccessToken: () => Promise<string>;

  constructor({
    crd,
    resource,
    keycloakAdmin,
    defaultCreateData,
    everyoneGroupId,
    getAccessToken
  }: {
    crd: Crd<T>,
    resource: CustomResource<T>,
    keycloakAdmin: KeycloakAdmin,
    defaultCreateData: any,
    everyoneGroupId: string,
    getAccessToken: () => Promise<string>
  }) {
    this.crd = crd;
    this.resource = resource;
    this.keycloakAdmin = keycloakAdmin;
    this.defaultCreateData = defaultCreateData;
    this.everyoneGroupId = everyoneGroupId;
    this.getAccessToken = getAccessToken;
  }

  public watch = (options?: {rewatch?: boolean}) => {
    const prefix = this.crd.getPrefix();
    logger.info({
      component: logger.components.watcher,
      type: 'START',
      resource: this.resource.getResourcePlural()
    });
    this.request = this.resource.watch((type, object) => {
      const handler = async () => {
        const accessToken = await this.getAccessToken();
        this.keycloakAdmin.setAccessToken(accessToken);

        if (type === 'ADDED') {
          // check if it's already on keycloak
          const role = await this.keycloakAdmin.roles.findOneByName({
            name: `${prefix}${object.metadata.name}`
          });

          if (role) {
            return;
          }

          logger.info({
            component: logger.components.watcher,
            type: 'ADD_ROLE',
            resource: this.resource.getResourcePlural(),
            name: object.metadata.name
          });
          // create one
          await this.crd.createOnKeycloak(
            this.defaultCreateData(object),
            object.metadata,
            object.spec,
            {
              kcAdminClient: this.keycloakAdmin,
              everyoneGroupId: this.everyoneGroupId
            }
          );
          logger.info({
            component: logger.components.watcher,
            type: 'SUCCESS_ADD_ROLE',
            resource: this.resource.getResourcePlural(),
            name: object.metadata.name
          });
        } else if (type === 'DELETED') {
          // delete the role on keycloak
          try {
            await this.keycloakAdmin.roles.delByName({
              name: `${prefix}${object.metadata.name}`
            });
            logger.info({
              component: logger.components.watcher,
              type: 'DELETE_ROLE',
              resource: this.resource.getResourcePlural(),
              name: object.metadata.name
            });
          } catch (e) {
            if (e.response && e.response.status === 404) {
              logger.info({
                component: logger.components.watcher,
                type: 'ROLE_ALREADY_DELETED',
                resource: this.resource.getResourcePlural(),
                name: object.metadata.name
              });
              return;
            }
            throw e;
          }
        }
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
