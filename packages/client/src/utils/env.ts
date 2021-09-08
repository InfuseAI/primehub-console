export function getAppPrefix() {
  const ret = window.APP_PREFIX;
  if (!ret || ret === '/') return '/';
  return `/${ret.replace(/\//g, '')}/`;
}

export const appPrefix = getAppPrefix();

export function getAccessToken() {
  return window.localStorage.getItem('primehub.accessToken');
}
