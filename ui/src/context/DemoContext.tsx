/**
 * ui/src/context/DemoContext.tsx
 *
 * Central mode manager for the ShadowSCAN frontend.
 *
 * Responsibilities
 * ----------------
 * 1. Reads the current mode from GET /mode on mount so the frontend
 *    stays in sync with the backend after a restart.
 * 2. When setIsDemoMode is called, POSTs to POST /mode so the backend
 *    switches mode and clears its RuntimeState atomically.
 * 3. Exposes `modeKey` — a counter that bumps on every mode switch.
 *    Pages include `modeKey` in their useEffect dependency arrays so
 *    their local state (alerts/flows/sessions arrays) resets automatically
 *    on every mode change, preventing stale demo data from appearing in
 *    live mode and vice-versa.
 */

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback
} from 'react';
import type { ReactNode } from 'react';
import { apiClient } from '../api/client';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------
interface DemoContextType {
  /** true = Demo Mode, false = Live Mode */
  isDemoMode: boolean;
  /** Call this to switch modes. Synchronises with the backend. */
  setIsDemoMode: (demo: boolean) => Promise<void>;
  /**
   * Incremented on every mode switch.
   * Add as a useEffect dependency in pages to auto-reset local state.
   */
  modeKey: number;
  /** true while the initial GET /mode is in flight */
  modeLoading: boolean;
}

// ---------------------------------------------------------------------------
// Context + Provider
// ---------------------------------------------------------------------------
const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Start in demo mode by default; will be overwritten by GET /mode result.
  const [isDemoMode, setIsDemoModeState] = useState<boolean>(true);
  const [modeKey, setModeKey] = useState<number>(0);
  const [modeLoading, setModeLoading] = useState<boolean>(true);

  // -----------------------------------------------------------------------
  // On mount: read current mode from backend so UI and backend are in sync
  // -----------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    const syncMode = async () => {
      try {
        const res = await apiClient.get('/mode');
        const backendMode: string = res.data?.current_mode ?? 'demo';
        if (isMounted) {
          setIsDemoModeState(backendMode === 'demo');
        }
      } catch {
        // If backend is not reachable yet, stay in demo mode (safe default).
      } finally {
        if (isMounted) setModeLoading(false);
      }
    };
    syncMode();
    return () => { isMounted = false; };
  }, []);

  // -----------------------------------------------------------------------
  // setIsDemoMode: toggle mode, POST to backend, bump modeKey
  // -----------------------------------------------------------------------
  const setIsDemoMode = useCallback(async (demo: boolean) => {
    const newMode = demo ? 'demo' : 'live';

    // Optimistically update the UI immediately for snappy feedback.
    setIsDemoModeState(demo);
    setModeKey(prev => prev + 1);  // causes all pages to reset their state

    try {
      await apiClient.post('/mode', { mode: newMode });
      // Backend confirmed the switch and cleared RuntimeState.
    } catch (err) {
      console.error('[DemoContext] Failed to sync mode with backend:', err);
      // The UI already switched — the backend will re-sync on the next poll.
    }
  }, []);

  return (
    <DemoContext.Provider value={{ isDemoMode, setIsDemoMode, modeKey, modeLoading }}>
      {children}
    </DemoContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
// eslint-disable-next-line react-refresh/only-export-components
export const useDemoContext = () => {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemoContext must be used within a DemoProvider');
  }
  return context;
};
