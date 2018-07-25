import KcAdminClient from 'keycloak-admin';
import { mapValues } from 'lodash';
import {unflatten} from 'flat';
import { EVERYONE_GROUP_ID } from './constant';

export const query = async (root, args, context) => {
  const kcAdminClient: KcAdminClient = context.kcAdminClient;
  const {attributes} = await kcAdminClient.groups.findOne({id: EVERYONE_GROUP_ID});
  const flatData = mapValues(attributes, value => {
    return (value && value[0]) || null;
  });
  return unflatten(flatData);
};
