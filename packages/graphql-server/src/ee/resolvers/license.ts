import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { keycloakMaxCount } from '../../resolvers/constant';
import { corev1KubeClient } from '../../crdClient/crdClientImpl';
import { Context } from '../../resolvers/interface';
import { createConfig } from '../../config';

let licenseOverride = {};

// this is used for integration test
export function overrideLienceseConfig(license = {}) {
  licenseOverride = license;
}

const getNodesFromApi = async () => {
  const { body: { items } } = await corev1KubeClient.listNode();
  return items;
};

export const query = async (root, args, context: Context) => {
  const config = createConfig();
  const {crdClient} = context;
  const kcAdminClient: KeycloakAdminClient = context.kcAdminClient;

  const users = await kcAdminClient.users.count;
  const groups = await kcAdminClient.groups.find({max: keycloakMaxCount});
  const nodes = await getNodesFromApi();
  const deploys = await crdClient.phDeployments.list();
  const deployed = deploys.filter(d => d.spec.stop === false);

  const license = {
    licensedTo: config.licensedTo,
    licenseStatus: config.licenseStatus,
    startedAt: config.startedAt,
    expiredAt: config.expiredAt,
    maxUser: config.maxUser,
    maxGroup: config.maxGroup,
    maxNode: config.maxNode,
    maxModelDeploy: config.maxModelDeploy,
    ...licenseOverride,
    usage: {
      // all groups minus 'everyone'
      maxUser: users,
      maxGroup: groups.length - 1,
      maxNode: nodes.length,
      maxModelDeploy: deployed.length,
    },
  };

  return license;
};
