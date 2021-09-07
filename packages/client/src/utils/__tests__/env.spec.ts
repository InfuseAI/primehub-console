import { getAppPrefix, getAccessToken } from '../env';

describe('utils > env', () => {
  it('getAccessToken should return localStorage content', () => {
    const spy = jest
      .spyOn(window.localStorage, 'getItem')
      .mockReturnValueOnce('test-token');
    const result = getAccessToken();
    expect(spy).toHaveBeenCalledWith('primehub.accessToken');
    expect(result).toBe('test-token');
  });

  it('getAppPrefix should return / if no APP_PREFIX', () => {
    window.APP_PREFIX = null;
    const result = getAppPrefix();
    expect(result).toBe('/');
  });

  it('getAppPrefix should return / if APP_PREFIX is `/`', () => {
    window.APP_PREFIX = '/';
    const result = getAppPrefix();
    expect(result).toBe('/');
  });

  it('getAppPrefix should return string with slash around if APP_PREFIX exist', () => {
    window.APP_PREFIX = 'console';
    const result = getAppPrefix();
    expect(result).toBe('/console/');
  });
});
