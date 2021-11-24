import { GroupContextValue } from 'context/group';
import { UserContextValue } from 'context/user';
import { get } from 'lodash';

export const checkUserIsGroupAdmin = (
  currentGroup: GroupContextValue,
  currentUser: UserContextValue
): boolean => {
  if (!currentUser) {
    return false;
  }
  const admins = get(currentGroup, 'admins', '');
  const adminList = admins ? admins.split(',') : [];
  return adminList.includes(currentUser.username);
};

// Ref: https://stackoverflow.com/a/14919494/563353
export const humanFileSize = (bytes, si = false, dp = 1): string => {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }

  const units = si
    ? ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (
    Math.round(Math.abs(bytes) * r) / r >= thresh &&
    u < units.length - 1
  );

  return bytes.toFixed(dp) + ' ' + units[u];
}

export const toGroupPath = (groupName: string) =>
  groupName.replace(/_/g, '-').toLowerCase();
