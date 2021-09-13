import { useEffect, useCallback, useState } from 'react';

type Status = 'inactive' | 'copied' | 'failed';

export function useClipboard({
  text = '',
  timeout = 1000,
  lazy = false,
}: {
  text?: string;
  timeout?: number;
  lazy?: boolean;
}) {
  const [status, setStatus] = useState<Status>('inactive');
  const copy = useCallback(
    (value?: string) => {
      if (lazy) {
        navigator.clipboard
          .writeText(value)
          .then(() => setStatus('copied'))
          .catch(() => setStatus('failed'));
      } else {
        navigator.clipboard
          .writeText(text)
          .then(() => setStatus('copied'))
          .catch(() => setStatus('failed'));
      }
    },
    [lazy, text]
  );

  useEffect(() => {
    if (status === 'inactive') return;

    const id = setTimeout(() => setStatus('inactive'), timeout);

    return () => clearTimeout(id);
  }, [status, timeout]);

  return [status, copy] as const;
}
