import { useEffect, useCallback, useState } from 'react';

type Status = 'inactive' | 'copied' | 'failed';

export function useClipboard({
  text,
  timeout = 1000,
}: {
  text: string;
  timeout?: number;
}) {
  const [status, setStatus] = useState<Status>('inactive');
  const copy = useCallback(() => {
    navigator.clipboard
      .writeText(text)
      .then(() => setStatus('copied'))
      .catch(() => setStatus('failed'));
  }, [text]);

  useEffect(() => {
    if (status === 'inactive') return;

    const id = setTimeout(() => setStatus('inactive'), timeout);

    return () => clearTimeout(id);
  }, [status, timeout]);

  return [status, copy] as const;
}
