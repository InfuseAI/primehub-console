function getAppPrefix() {
  const appPrefix = (window as any).APP_PREFIX;
  if (!appPrefix || appPrefix === '/') return '/';
  return `/${appPrefix.replace(/\//g, '')}/`;
}

export const appPrefix = getAppPrefix();

export function getAccessToken() {
  return window.localStorage.getItem('canner.accessToken');
}
