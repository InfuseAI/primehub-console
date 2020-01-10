import { timezones } from '../utils/timezones';

// constants
const findTimezone = () => {
  const systemOffset = - (new Date().getTimezoneOffset() / 60);
  if (systemOffset === 8) {
    return {
      label: 'Taipei',
      name: 'Asia/Taipei',
      offset: 8,
    };
  }
  const timezone = timezones.find(tz => tz.offset === systemOffset);
  return timezone || {
    label: 'GMT (no daylight saving)',
    name: 'Etc/GMT',
    offset: 0,
  };
};
const DEFAULT_TIMEZONE = findTimezone();

export const createDefaultSystemSettings = (defaultUserVolumeCapacity: string) => ({
  org: {
    name: 'InfuseAI',
    logo: null
  },
  defaultUserVolumeCapacity,
  timezone: DEFAULT_TIMEZONE
});

export const keycloakMaxCount = 10000;

export const defaultWorkspaceId = 'default';

export const IMAGE_SPEC_JOB_NAME_LABEL = 'imagespecs.primehub.io/name';

export const IMAGE_SPEC_JOB_HASH_ANNOTATION = 'imagespecs.primehub.io/hash';
