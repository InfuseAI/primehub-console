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

export const createDetaultSystemSettings = (defaultUserVolumeCapacity: string) => ({
  org: {
    name: 'infuse ai',
    logo: null
  },
  defaultUserVolumeCapacity,
  timezone: DEFAULT_TIMEZONE
});

export const keycloakMaxCount = 10000;
