// tslint:disable:no-console
import CrdClient from '../crdClient/crdClientImpl';
import KeycloakAdmin from 'keycloak-admin';

export default class Observer {
  private crdClient: CrdClient;
  private keycloakAdmin: KeycloakAdmin;

  constructor(crdClient: CrdClient, keycloakAdmin: KeycloakAdmin) {
    this.crdClient = crdClient;
    this.keycloakAdmin = keycloakAdmin;
  }

  public watch() {
    const resources = [{
      crd: this.crdClient.datasets,
      prefix: 'ds'
    }, {
      crd: this.crdClient.images,
      prefix: 'img'
    }, {
      crd: this.crdClient.instanceTypes,
      prefix: 'it'
    }];

    resources.forEach(resource => {
      resource.crd.watch(async (type, object) => {
        if (type === 'ADDED') {
          // check if it's already on keycloak
          const role = await this.keycloakAdmin.roles.findOneByName({
            name: `${resource.prefix}:${object.name}`
          });
          if (!role) {
            // ...
          }
        } else if (type === 'DELETED') {
          // delete the role on keycloak
        }
      });
    });
  }
}
