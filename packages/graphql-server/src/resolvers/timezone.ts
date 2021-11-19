import KcAdminClient from 'keycloak-admin';
import { mapValues, get } from 'lodash';
import { unflatten } from 'flat';
import { DEFAULT_TIMEZONE } from './constant';
import { Context } from './interface';
import { findTimezone } from '../utils/timezones';

export const query = async (root, args, context: Context) => {
  const everyoneGroupId = context.everyoneGroupId;
  const kcAdminClient: KcAdminClient = context.kcAdminClient;
  const { attributes } = await kcAdminClient.groups.findOne({
    id: everyoneGroupId,
  });

  const fetchedData = unflatten(
    mapValues(attributes, value => {
      return (value && value[0]) || null;
    })
  );
  const timezone =
    findTimezone(get(fetchedData, 'timezone')) || DEFAULT_TIMEZONE;

  return timezone;
};
