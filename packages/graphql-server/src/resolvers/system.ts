import KcAdminClient from 'keycloak-admin';
import { mapValues, isEmpty, get, isUndefined, isNil, reduce, isPlainObject, isNull } from 'lodash';
import { unflatten, flatten } from 'flat';
import { createDefaultSystemSettings } from './constant';
import { Context } from './interface';
import { parseFromAttr, toAttr, parseDiskQuota, stringifyDiskQuota } from './utils';
import { findTimezone } from '../utils/timezones';
import {createConfig} from '../config';

const config = createConfig();

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
  const defaultSystemSettings = createDefaultSystemSettings(context.defaultUserVolumeCapacity);
  if (isEmpty(attributes)) {
    return {
      ...defaultSystemSettings,
      defaultUserVolumeCapacity: parseDiskQuota(defaultSystemSettings.defaultUserVolumeCapacity)
    };
  }

  const license = {
    licenseTo: config.licenseTo,
    licenseStatus: config.licenseStatus,
    enableGroup: config.enableGroup,
    startedAt: config.startedAt,
    expiredAt: config.expiredAt,
    maxGroup: config.maxGroup
  };

  const flatData = mapValues(attributes, value => {
    return (value && value[0]) || null;
  });
  const fetchedData: any = unflatten(flatData);
  let timezoneName = get(fetchedData, 'timezone');

  // https://gitlab.com/infuseai/canner-admin-ui/issues/97
  // we changed timezone format at #97, so we fallback to read this format
  if (isPlainObject(timezoneName)) {
    timezoneName = timezoneName.name;
  }

  // find the timezone data by its name
  const timezone = timezoneName ? findTimezone(timezoneName) : defaultSystemSettings.timezone;
  return {
    org: {
      name: get(fetchedData, 'org.name') || defaultSystemSettings.org.name,
      logo: get(fetchedData, 'org.logo') ? {
        contentType: get(fetchedData, 'org.logo.contentType'),
        name: get(fetchedData, 'org.logo.name'),
        size: parseInt(get(fetchedData, 'org.logo.size'), 10),
        url: get(fetchedData, 'org.logo.url')
      } : defaultSystemSettings.org.logo
    },
    defaultUserVolumeCapacity:
      parseDiskQuota(fetchedData.defaultUserVolumeCapacity || defaultSystemSettings.defaultUserVolumeCapacity),
    timezone,
    license
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
  const defaultSystemSettings = createDefaultSystemSettings(context.defaultUserVolumeCapacity);
  const everyoneGroupId = context.everyoneGroupId;
  const kcAdminClient: KcAdminClient = context.kcAdminClient;
  const {attributes} = await kcAdminClient.groups.findOne({id: everyoneGroupId});
  const orgName = parseFromAttr('org.name', attributes);
  const orgLogoContentType = parseFromAttr('org.logo.contentType', attributes);
  const orgLogoName = parseFromAttr('org.logo.name', attributes);
  const orgLogoSize = parseFromAttr('org.logo.size', attributes, parseInt);
  const orgLogoUrl = parseFromAttr('org.logo.url', attributes);
  const defaultUserVolumeCapacity = parseFromAttr('defaultUserVolumeCapacity', attributes, parseDiskQuota);

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

  // merge timezone
  // https://gitlab.com/infuseai/canner-admin-ui/issues/97
  // we changed timezone format at #97, so we fallback to read this format
  const originTimezone = parseFromAttr('timezone.name', attributes) || parseFromAttr('timezone', attributes);

  // merge data
  const mergedData: Record<string, any> = {
    org: {
      name: get(payload, 'org.name') || orgName,
      logo: (logo) ? logo : undefined
    },
    timezone: originTimezone,
    defaultUserVolumeCapacity: payload.defaultUserVolumeCapacity || defaultUserVolumeCapacity,
  };

  // timezone
  // if name not found in dataset, do not update
  const timezoneName = get(payload, 'timezone.name');
  const timezone = findTimezone(timezoneName);
  if (timezone) {
    mergedData.timezone = timezone.name;
  }

  const savedToDB = {
    ...mergedData,
    defaultUserVolumeCapacity: mergedData.defaultUserVolumeCapacity ?
      stringifyDiskQuota(mergedData.defaultUserVolumeCapacity) : undefined
  };

  const flatData = flatten(savedToDB);

  // merge original attributes as well, there might be manually set attribute
  const attrs = {
    ...attributes,
    ...toAttr(flatData),
  };

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
        ''
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

  // add timezone offset for ui
  const response = {
    ...mergedData,
    timezone: timezone || defaultSystemSettings.timezone,
  };

  return response;
};
