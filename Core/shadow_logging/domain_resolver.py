import os
import json
import socket
from loguru import logger

CACHE_FILE = "models/domain_intel_cache.json"


class DomainResolver:
    def __init__(self):
        self.cache = {}
        self._load_cache()

    def _load_cache(self):
        """Loads persistently stored IP-to-Domain threat mappings."""
        if os.path.exists(CACHE_FILE):
            try:
                with open(CACHE_FILE, "r") as f:
                    self.cache = json.load(f)
                logger.info(f"💾 Loaded {len(self.cache)} mapped entities into memory.")
            except Exception as e:
                logger.error(f"Failed to load Intel Cache database: {e}")
                self.cache = {}
        else:
            self.cache = {}

    def _save_cache(self):
        """Persists learned intelligence to disk so it remembers on next boot."""
        try:
            os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
            with open(CACHE_FILE, "w") as f:
                json.dump(self.cache, f, indent=4)
        except Exception as e:
            logger.error(f"Failed to persist Intel Cache: {e}")

    def resolve(self, ip: str) -> str:
        """
        Intelligently resolves host records, references cache for immediate matches,
        and dynamically promotes unknown targets to classified entities.
        """
        if not ip:
            return "Unknown"

        # 1. Instantly classify infrastructure boundaries
        if ip.startswith("192.168.") or ip.startswith("10.") or ip.startswith("127."):
            return "internal-lan.local"

        # 2. Hit the Persistent Intelligence Pool
        if ip in self.cache:
            return self.cache[ip]

        # 3. Cache Miss: Intelligently discover the host
        try:
            socket.setdefaulttimeout(0.4)  # Fast timeout so pipeline never blocks
            hostname, _, _ = socket.gethostbyaddr(ip)

            # Map discovered infrastructure
            self.cache[ip] = hostname
            self._save_cache()
            logger.success(f"🧠 Learned identity of new host: {ip} -> {hostname}")
            return hostname

        except (socket.herror, socket.gaierror):
            # No Reverse DNS record found - promote to unverified trackable status
            self.cache[ip] = "Unverified Entity"
            self._save_cache()
            return "Unverified Entity"

        except socket.timeout:
            # DNS endpoint did not answer in time
            return "Unknown (Timeout)"

        except Exception:
            return "Unknown Source"

    def get_all_unverified(self) -> dict:
        """Returns lists of unverified entities for frontend triage panels."""
        return {
            ip: domain
            for ip, domain in self.cache.items()
            if "Unverified" in domain or "Unknown" in domain
        }
