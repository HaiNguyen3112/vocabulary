import { useEffect, useRef, useState } from "react";
import { ApiError, getErrorMessage } from "@/api/client";

type RemoteState<T> = {
  data: T | null;
  error: string | null;
  /** HTTP status of the failed request (e.g. 404), null for network errors. */
  errorStatus: number | null;
  isLoading: boolean;
};

/**
 * Fetches `load()` whenever `key` changes; aborts the stale request.
 * Keeps the previous data while the next one loads so lists do not flash empty.
 */
export function useRemote<T>(key: string, load: (signal: AbortSignal) => Promise<T>, errorMessage: string) {
  const [state, setState] = useState<RemoteState<T>>({
    data: null,
    error: null,
    errorStatus: null,
    isLoading: true,
  });
  const [reloadCount, setReloadCount] = useState(0);
  // Latest loader without making it an effect dependency (callers pass inline functions).
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ ...prev, isLoading: true, error: null, errorStatus: null }));
    const run = async () => {
      try {
        const data = await loadRef.current(controller.signal);
        if (!controller.signal.aborted) setState({ data, error: null, errorStatus: null, isLoading: false });
      } catch (error) {
        if (!controller.signal.aborted) {
          setState((prev) => ({
            ...prev,
            error: getErrorMessage(error, errorMessage),
            errorStatus: error instanceof ApiError ? error.status : null,
            isLoading: false,
          }));
        }
      }
    };
    void run();
    return () => controller.abort();
  }, [key, reloadCount, errorMessage]);

  return { ...state, reload: () => setReloadCount((count) => count + 1) };
}
