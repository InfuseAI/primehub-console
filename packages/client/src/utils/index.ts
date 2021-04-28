import {GroupContextValue} from 'context/group';
import {UserContextValue} from 'context/user';
import {get} from 'lodash';

export const checkUserIsGroupAdmin = (currentGroup: GroupContextValue, currentUser: UserContextValue): boolean => {
  if (!currentUser) {
    return false;
  }
  const admins = get(currentGroup, 'admins', '');
  const adminList = admins ? admins.split(',') : [];
  return adminList.includes(currentUser.username);
};
