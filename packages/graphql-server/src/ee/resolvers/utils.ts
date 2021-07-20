import { ApolloError } from 'apollo-server';
import { Context } from '../../resolvers/interface';
import { createConfig } from '../../config';

const config = createConfig();
const LICENSE_ERROR = 'LICENSE_ERROR';
const LICENSE_QUOTA_EXCEEDED = 'LICENSE_QUOTA_EXCEEDED';

export const validateLicense = () => {
    const status = config.licenseStatus.toLowerCase();
    switch (status) {
      case 'unexpired':
        return;
      case 'invalid':
        throw new ApolloError('License invalid', LICENSE_ERROR);
      case 'expired':
        throw new ApolloError('License expired', LICENSE_ERROR);
      default:
        return;
    }
};

export const validateModelDeployQuota = async (context: Context) => {
  // -1 = unlimited
  if (config.maxModelDeploy === -1) {
    return;
  }

  const {crdClient} = context;
  const deploys = await crdClient.phDeployments.list();
  const deployed = deploys.filter(d => d.spec.stop === false);
  if (deployed.length >= Math.ceil(1.1 * config.maxModelDeploy)) {
    throw new ApolloError('Number of running model deployments exceeds license limitation', LICENSE_QUOTA_EXCEEDED);
  }
};
