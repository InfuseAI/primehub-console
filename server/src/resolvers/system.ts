import KcAdminClient from 'keycloak-admin';
import { mapValues, isEmpty, get } from 'lodash';
import { unflatten, flatten } from 'flat';
import { detaultSystemSettings } from './constant';
import { Context } from './interface';
import { parseFromAttr, toAttr } from './utils';
import { Attributes, FieldType } from './attr';

export const query = async (root, args, context: Context) => {
  const everyoneGroupId = context.everyoneGroupId;
  const kcAdminClient: KcAdminClient = context.kcAdminClient;
  const {attributes} = await kcAdminClient.groups.findOne({id: everyoneGroupId});
  if (isEmpty(attributes)) {
    return detaultSystemSettings;
  }

  const flatData = mapValues(attributes, value => {
    return (value && value[0]) || null;
  });
  const fetchedData: any = unflatten(flatData);
  return {
    org: {
      name: get(fetchedData, 'org.name') || detaultSystemSettings.org.name,
      logo: get(fetchedData, 'org.logo') ? {
        contentType: get(fetchedData, 'org.logo.contentType'),
        name: get(fetchedData, 'org.logo.name'),
        size: parseInt(get(fetchedData, 'org.logo.size'), 10),
        url: get(fetchedData, 'org.logo.url')
      } : detaultSystemSettings.org.logo
    },
    defaultUserDiskQuota: fetchedData.defaultUserDiskQuota || detaultSystemSettings.defaultUserDiskQuota
  };
};

export const update = async (root, args, context) => {
  const everyoneGroupId = context.everyoneGroupId;
  const kcAdminClient: KcAdminClient = context.kcAdminClient;
  const {attributes} = await kcAdminClient.groups.findOne({id: everyoneGroupId});
  const orgName = parseFromAttr('org.name', attributes);
  const orgLogoContentType = parseFromAttr('org.logo.contentType', attributes);
  const orgLogoName = parseFromAttr('org.logo.name', attributes);
  const orgLogoSize = parseFromAttr('org.logo.size', attributes, parseInt);
  const orgLogoUrl = parseFromAttr('org.logo.url', attributes);
  const defaultUserDiskQuota = parseFromAttr('defaultUserDiskQuota', attributes);

  // merge with payload
  const payload = args.data;
  let logo: any;
  if (get(payload, 'org.logo')) {
    logo = get(payload, 'org.logo');
  } else if (orgLogoUrl) {
    logo = {
      contentType: orgLogoContentType,
      name: orgLogoName,
      size: orgLogoSize,
      url: orgLogoUrl
    };
  }
  const mergedData = {
    org: {
      name: get(payload, 'org.name') || orgName,
      logo: (logo) ? logo : undefined
    },
    defaultUserDiskQuota: payload.defaultUserDiskQuota || defaultUserDiskQuota
  };

  const flatData = flatten(mergedData);
  const attrs = toAttr(flatData);
  await kcAdminClient.groups.update({id: everyoneGroupId}, {
    attributes: attrs
  });

  return mergedData;
};
