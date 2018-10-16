import KcAdminClient from 'keycloak-admin';
import { mapValues, isEmpty, get, isUndefined, isNil, reduce } from 'lodash';
import { unflatten, flatten } from 'flat';
import { detaultSystemSettings } from './constant';
import { Context } from './interface';
import { parseFromAttr, toAttr, parseDiskQuota, stringifyDiskQuota } from './utils';
const smtpKeyMapping = {
  enableSSL: 'ssl',
  enableStartTLS: 'starttls',
  enableAuth: 'auth',
  username: 'user'
};

export const query = async (root, args, context: Context) => {
  const everyoneGroupId = context.everyoneGroupId;
  const kcAdminClient: KcAdminClient = context.kcAdminClient;
  const {attributes} = await kcAdminClient.groups.findOne({id: everyoneGroupId});
  if (isEmpty(attributes)) {
    return {...detaultSystemSettings, defaultUserDiskQuota: parseDiskQuota(detaultSystemSettings.defaultUserDiskQuota)};
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
    defaultUserDiskQuota: parseDiskQuota(fetchedData.defaultUserDiskQuota || detaultSystemSettings.defaultUserDiskQuota)
  };
};

// if val is not defined or equals to 'false', return false, otherwise true.
const parseBooleanString = val => val === 'true';
export const querySmtp = async (root, args, context: Context) => {
  const {kcAdminClient, realm} = context;
  const foundRealm = await kcAdminClient.realms.findOne({realm});
  const smtpServer = foundRealm.smtpServer || {} as any;
  return {
    ...smtpServer,
    port: smtpServer.port && parseInt(smtpServer.port, 10) || 25,
    enableSSL: parseBooleanString(smtpServer.ssl),
    enableStartTLS: parseBooleanString(smtpServer.starttls),
    enableAuth: parseBooleanString(smtpServer.auth),
    username: smtpServer.user
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
  const defaultUserDiskQuota = parseFromAttr('defaultUserDiskQuota', attributes, parseDiskQuota);

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

  const savedToDB = {
    ...mergedData,
    defaultUserDiskQuota: mergedData.defaultUserDiskQuota ?
      stringifyDiskQuota(mergedData.defaultUserDiskQuota) : undefined
  };

  const flatData = flatten(savedToDB);
  const attrs = toAttr(flatData);
  await kcAdminClient.groups.update({id: everyoneGroupId}, {
    attributes: attrs
  });

  // update to realm displayName and displayNameHtml
  if (get(payload, 'org.logo.url') || get(payload, 'org.name')) {
    await kcAdminClient.realms.update({realm: context.realm}, {
      displayName: get(payload, 'org.name'),
      displayNameHtml: get(payload, 'org.logo.url') ?
        // tslint:disable-next-line:max-line-length
        `<img src="${get(payload, 'org.logo.url')}" alt="${get(payload, 'org.name') ? get(payload, 'org.name') : ''}" width="500" >` :
        undefined
    });
  }

  // update smtp
  const smtp = payload.smtp;

  if (smtp) {
    const smtpPayload = reduce(smtp, (result, val, key) => {
      if (isNil(val)) {
        return result;
      }

      if (smtpKeyMapping[key]) {
        key = smtpKeyMapping[key];
      }

      result[key] = val.toString();
      return result;
    }, {});

    await kcAdminClient.realms.update({realm: context.realm}, {
      smtpServer: smtpPayload
    });
  }

  return mergedData;
};
