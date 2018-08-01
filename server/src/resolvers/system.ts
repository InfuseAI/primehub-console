import KcAdminClient from 'keycloak-admin';
import { mapValues, isEmpty } from 'lodash';
import { unflatten } from 'flat';
import { EVERYONE_GROUP_ID, detaultSystemSettings } from './constant';

export const query = async (root, args, context) => {
  const kcAdminClient: KcAdminClient = context.kcAdminClient;
  const {attributes} = await kcAdminClient.groups.findOne({id: EVERYONE_GROUP_ID});
  if (isEmpty(attributes)) {
    return detaultSystemSettings;
  }

  const flatData = mapValues(attributes, value => {
    return (value && value[0]) || null;
  });
  const fetchedData: any = unflatten(flatData);
  return {
    org: {
      name: fetchedData.name || detaultSystemSettings.org.name,
      logo: fetchedData.logo || detaultSystemSettings.org.logo
    },
    defaultUserDiskQuota: fetchedData.defaultUserDiskQuota || detaultSystemSettings.defaultUserDiskQuota
  };
};
