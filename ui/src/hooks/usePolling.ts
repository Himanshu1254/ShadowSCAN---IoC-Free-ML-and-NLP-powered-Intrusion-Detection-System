/**
 * ui/src/hooks/usePolling.ts
 *
 * Generic polling hook for ShadowSCAN data pages.
 *
 * Responsibilities
 * ----------------
 * 1. Polls `endpoint` every `intervalMs` milliseconds.
 * 2. Immediately resets local state and restarts the interval whenever
 *    `modeKey` changes (mode switch), so stale data never survives a
 *    demo → live or live → demo transition.
 * 3. Handles mount/unmount cleanup automatically — callers never manage
 *    setInterval or isMounted themselves.
 * 4. Accepts an optional `transform` function so callers can reshape the
 *    raw API response before it hits their state.
 *
 * Usage
 * -----
 * const { data, loading, error } = usePolling<Flow[]>({
 *   endpoint: '/flows',
 *   intervalMs: 2000,
 *   initialValue: [],
 * });
 *
 * With transform:
 * const { data } = usePolling<GeoPoint[]>({
 *   endpoint: '/alerts',
 *   intervalMs: 2000,
 *   initialValue: [],
 *   transform: (raw) => raw.map(toGeoPoint),
 * });
 *
 * Mode isolation guarantee
 * ------------------------
 * `modeKey` is read from `DemoContext` inside this hook. When the user
 * switches modes, `modeKey` increments, which:
 *   a) tears down the current interval
 *   b) clears `data` back to `initialValue`
 *   c) sets `loading = true`
 *   d) fires an immediate fetch on the same endpoint
 * The endpoint returns the correct data for the new mode because the
 * backend's StateManager has already cleared its own stores.
 */

import { useEffect, useRef, useState } from 'react';
import { apiClient } from '../api/client';
import { useDemoContext } from '../context/DemoContext';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UsePollingOptions<T> {
  /** Backend endpoint path, e.g. '/alerts', '/flows'. No query params needed. */
  endpoint: string;
  /** Polling interval in milliseconds. Defaults to 2000. */
  intervalMs?: number;
  /** Value used when data is reset (on mount, on mode switch, on error). */
  initialValue: T;
  /**
   * Optional transform applied to raw API response data before storing.
   * If omitted, the raw response data is stored as-is.
   */
  transform?: (raw: unknown) => T;
  /**
   * Whether to enable polling at all. Pass `false` to disable the interval
   * (e.g. for one-shot fetches). Defaults to `true`.
   */
  enabled?: boolean;
}

export interface UsePollingResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  /** Call this to immediately trigger a one-off re-fetch outside the interval. */
  refetch: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePolling<T>({
  endpoint,
  intervalMs = 2000,
  initialValue,
  transform,
  enabled = true,
}: UsePollingOptions<T>): UsePollingResult<T> {
  const { modeKey } = useDemoContext();

  const [data, setData]       = useState<T>(initialValue);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError]     = useState<string | null>(null);

  // Stable ref for the fetch function — avoids stale closures in setInterval
  const fetchRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    if (!enabled) return;

    // ── Mode switch guard ──────────────────────────────────────────────────
    // Reset to initial value immediately so the UI clears while the first
    // request for the new mode is in flight.
    setData(initialValue);
    setLoading(true);
    setError(null);

    let active = true; // local mount guard

    const doFetch = async () => {
      try {
        const res = await apiClient.get(endpoint);
        if (!active) return;
        const value = transform ? transform(res.data) : (res.data as T);
        setData(value);
        setError(null);
      } catch (err: unknown) {
        if (!active) return;
        const msg = err?.response?.data?.detail ?? err?.message ?? 'Fetch failed';
        setError(msg);
      } finally {
        if (active) setLoading(false);
      }
    };

    // Assign to ref so callers can trigger a manual refetch
    fetchRef.current = doFetch;

    // Immediate first fetch
    doFetch();

    // Recurring interval
    const id = setInterval(doFetch, intervalMs);

    return () => {
      active = false;
      clearInterval(id);
    };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeKey, endpoint, intervalMs, enabled]);
  //  ^^^^^^^ ← key dep: re-runs the whole effect on every mode switch

  const refetch = () => { fetchRef.current(); };

  return { data, loading, error, refetch };
}
