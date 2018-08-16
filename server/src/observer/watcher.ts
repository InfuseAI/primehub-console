// tslint:disable:no-console
import KeycloakAdmin from 'keycloak-admin';
import { Crd } from '../resolvers/crd';
import CustomResource from '../crdClient/customResource';
import { isUndefined } from 'lodash';

export default class Watcher<T> {
  private crd: Crd<T>;
  private resource: CustomResource<T>;
  private keycloakAdmin: KeycloakAdmin;
  private defaultCreateData: any;
  private everyoneGroupId: string;
  private request: any;

  constructor({
    crd,
    resource,
    keycloakAdmin,
    defaultCreateData,
    everyoneGroupId
  }: {
    crd: Crd<T>,
    resource: CustomResource<T>,
    keycloakAdmin: KeycloakAdmin,
    defaultCreateData: any,
    everyoneGroupId: string
  }) {
    this.crd = crd;
    this.resource = resource;
    this.keycloakAdmin = keycloakAdmin;
    this.defaultCreateData = defaultCreateData;
    this.everyoneGroupId = everyoneGroupId;
  }

  public watch(options?: {rewatch?: boolean}) {
    const prefix = this.crd.getPrefix();
    console.log(`Watcher: started watching ${this.resource.getResourcePlural()}...`);
    this.request = this.resource.watch((type, object) => {
      const handler = async () => {
        if (type === 'ADDED') {
          // check if it's already on keycloak
          console.log(`Watcher:${this.resource.getResourcePlural()}: ${object.metadata.name} added event`);
          const role = await this.keycloakAdmin.roles.findOneByName({
            name: `${prefix}${object.metadata.name}`
          });
          if (!role) {
            // tslint:disable-next-line:max-line-length
            console.log(`Watcher:${this.resource.getResourcePlural()}: ${object.metadata.name} role not exist. Going to add one`);
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
            console.log(`Watcher:${this.resource.getResourcePlural()}: ${object.metadata.name} added to keycloak`);
          } else {
            console.log(`Watcher:${this.resource.getResourcePlural()}: ${object.metadata.name} role already exist`);
          }
        } else if (type === 'DELETED') {
          // delete the role on keycloak
          try {
            await this.keycloakAdmin.roles.delByName({
              name: `${prefix}${object.metadata.name}`
            });
            console.log(`Watcher:${this.resource.getResourcePlural()}: ${object.metadata.name} role deleted`);
          } catch (e) {
            console.log(`Watcher:${this.resource.getResourcePlural()}: ${object.metadata.name} cannot be deleted`);
            console.log(e.stack);
          }
        }
      };

      handler()
        .catch(err => console.log(err.stack));
    }, err => {
      if (err) {
        return console.log(err);
      }

      const rewatch = (options && !isUndefined(options.rewatch)) ? options.rewatch : true;
      if (rewatch) {
        this.watch(options);
      }
    });
  }

  public abort() {
    this.request.abort();
  }
}
