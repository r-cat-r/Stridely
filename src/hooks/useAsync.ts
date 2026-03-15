/**
 * Async operation hook with loading and error states
 */

import { useState, useCallback } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAsync<T>(): [
  AsyncState<T>,
  (fn: () => Promise<T>) => Promise<T | null>
] {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (fn: () => Promise<T>): Promise<T | null> => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fn();
      setState({ data, loading: false, error: null });
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setState((s) => ({ ...s, loading: false, error }));
      return null;
    }
  }, []);

  return [state, execute];
}

export function useAsyncAction<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>
): [AsyncState<T>, (...args: Args) => Promise<T | null>] {
  const [state, execute] = useAsync<T>();
  const run = useCallback(
    (...args: Args) => execute(() => fn(...args)),
    [execute, fn]
  );
  return [state, run];
}
