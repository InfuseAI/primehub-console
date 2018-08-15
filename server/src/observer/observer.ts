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

  public watchDataset() {
    this.crdClient.datasets.watch(((type, object) => {
      if (type === 'ADDED') {
        // check if it's already on keycloak
      }
    }));
  }
}
