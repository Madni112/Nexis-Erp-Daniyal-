import { useState, useEffect, useCallback } from 'react';

export interface HubState<T> {
  value: T | null;
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
  setValue: React.Dispatch<React.SetStateAction<T | null>>;
}

export function useHub<T>(
  fetcher: () => Promise<T>,
  deps: any[] = []
): HubState<T> {
  const [value, setValue] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetcher();
      setValue(res);
    } catch (err: any) {
      console.error('useHub fetch error:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  return { value, loading, error, reload, refresh: reload, setValue };
}
