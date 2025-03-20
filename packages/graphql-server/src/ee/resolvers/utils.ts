import { ApolloError } from 'apollo-server';
import { Context } from '../../resolvers/interface';
import { createConfig } from '../../config';

const config = createConfig();
const LICENSE_ERROR = 'LICENSE_ERROR';
const EXCEED_QUOTA_ERROR = 'EXCEED_QUOTA';

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

export const validateModelDeployQuota = async (context: Context, excludeId = '') => {
  // -1 = unlimited
  if (config.maxModelDeploy === -1) {
    return;
  }

  const {crdClient} = context;
  const deploys = await crdClient.phDeployments.list();
  const deployed = deploys.filter(d => d.spec.stop === false).filter(d => d.metadata.name !== excludeId);
  if (deployed.length >= Math.ceil(1.1 * config.maxModelDeploy)) {
    throw new ApolloError('Number of running model deployments exceeds license limitation', EXCEED_QUOTA_ERROR);
  }
};

export const getGpuLimit = (instanceType: any) => {
  const spec = instanceType.spec;
  if (!spec) {
    return 0;
  }
  if ('limits.gpu' in spec) {
    return spec['limits.gpu'];
  }
  if ('limits.nvidia.com/gpu' in spec) {
    return spec['limits.nvidia.com/gpu'];
  }
};
