import { useEffect, useState } from 'react';

export function useRoutePrefix() {
  const [appPrefix, setAppPrefix] = useState('/');

  useEffect(() => {
    if (window?.APP_PREFIX) {
      setAppPrefix(window.APP_PREFIX);
    }
  }, []);

  return { appPrefix };
}
