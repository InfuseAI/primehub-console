import { ApolloError } from 'apollo-server';
import { createConfig } from '../../config';

const config = createConfig();
const LICENSE_ERROR = 'LICENSE_ERROR';

export const validateLicense = () => {
    let status = config.licenseStatus.toLowerCase();
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
}
