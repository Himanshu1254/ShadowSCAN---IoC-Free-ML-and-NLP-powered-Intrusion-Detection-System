"""
Core/mode_manager.py

Singleton ModeManager that owns the single source of truth for
whether ShadowSCAN is operating in Demo Mode or Live Mode.

Rules:
- Only two valid modes: "demo" and "live"
- Switching mode clears RuntimeState + metrics so demo data
  can never bleed into live data and vice-versa.
- All four data endpoints (/alerts /flows /sessions /overview/stats)
  consult mode_manager.current_mode before deciding what to return.
"""

import threading
from datetime import datetime, timezone


class ModeManager:
    """
    Thread-safe singleton that tracks the current operating mode.
    Import the module-level `mode_manager` instance everywhere.
    """

    VALID_MODES = {"demo", "live"}

    def __init__(self):
        self._lock = threading.Lock()
        self._current_mode: str = "demo"          # default: Demo Mode on startup
        self._switched_at: datetime = datetime.now(timezone.utc)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    @property
    def current_mode(self) -> str:
        """Return the active mode string: 'demo' or 'live'."""
        with self._lock:
            return self._current_mode

    def get_mode(self) -> dict:
        """
        Return a dict suitable for the GET /mode response body.
        """
        with self._lock:
            return {
                "current_mode": self._current_mode,
                "switched_at": self._switched_at.isoformat(),
            }

    def set_mode(self, mode: str) -> dict:
        """
        Switch operating mode.

        Parameters
        ----------
        mode : str
            Must be 'demo' or 'live'.

        Returns
        -------
        dict
            Confirmation payload for the POST /mode response.

        Raises
        ------
        ValueError
            If `mode` is not one of VALID_MODES.
        """
        mode = mode.strip().lower()
        if mode not in self.VALID_MODES:
            raise ValueError(
                f"Invalid mode '{mode}'. Must be one of: {sorted(self.VALID_MODES)}"
            )

        with self._lock:
            previous = self._current_mode
            self._current_mode = mode
            self._switched_at = datetime.now(timezone.utc)

        # Clear all shared runtime state so demo / live data never mix.
        # Imported here (inside method) to avoid circular-import at module load.
        self._clear_runtime_state()

        return {
            "previous_mode": previous,
            "current_mode": mode,
            "switched_at": self._switched_at.isoformat(),
            "state_cleared": True,
        }

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _clear_runtime_state() -> None:
        """
        Delegate state clearing to StateManager.on_mode_switch().

        StateManager is the authoritative owner of all runtime stores.
        It clears both LiveRuntimeState and DemoRuntimeState atomically
        and resets Core metrics counters.  ModeManager does not access
        individual state objects directly — that responsibility belongs
        to StateManager.
        """
        try:
            from NIDS.engine.runtime_state import state_manager
            state_manager.on_mode_switch()
        except Exception:
            # If state_manager is not yet initialised (e.g. very early in boot),
            # nothing needs clearing — the stores start empty by default.
            pass


# ------------------------------------------------------------------
# Module-level singleton — import this everywhere
# ------------------------------------------------------------------
mode_manager = ModeManager()
