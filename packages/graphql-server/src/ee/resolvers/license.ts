import KcAdminClient from 'keycloak-admin';
import { keycloakMaxCount } from '../../resolvers/constant';
import { client as kubeClient } from '../../crdClient/crdClientImpl';
import { Context } from '../../resolvers/interface';
import { createConfig } from '../../config';

const config = createConfig();
let licenseOverride = {};

// this is used for integratino test
export function overrideLienceseConfig(license = {}) {
  licenseOverride = license;
}

export const query = async (root, args, context: Context) => {
  const {crdClient} = context;
  const kcAdminClient: KcAdminClient = context.kcAdminClient;

  const groups = await kcAdminClient.groups.find({max: keycloakMaxCount});
  const nodes = await kubeClient.api.v1.nodes.get();
  const deploys = await crdClient.phDeployments.list();
  const deployed = deploys.filter(d => d.spec.stop === false);

  const license = {
    licensedTo: config.licensedTo,
    licenseStatus: config.licenseStatus,
    startedAt: config.startedAt,
    expiredAt: config.expiredAt,
    maxGroup: config.maxGroup,
    maxNode: config.maxNode,
    maxModelDeploy: config.maxModelDeploy,
    ...licenseOverride,
    usage: {
      // all groups minus 'everyone'
      maxGroup: groups.length - 1,
      maxNode: nodes.body.items.length,
      maxModelDeploy: deployed.length,
    },
  };

  return license;
};
