"""
Core/demo_provider.py

Self-contained DemoProvider that owns ALL demo/mock/replay data for
ShadowSCAN's Demo Mode.

Architecture
------------
DemoProvider
  └── ReplayEngine
        ├── 6 attack scenarios (SQL Injection, Port Scan, DDoS,
        │   DNS Flood, Ransomware, Botnet)
        └── ReplayScheduler  — advances the scenario index on every
                               call so the dashboard feels live.

Usage (in main.py)
------------------
    from Core.demo_provider import demo_provider

    @app.get("/alerts")
    def get_alerts():
        if mode_manager.current_mode == "demo":
            return demo_provider.get_alerts()
        ...

Public Methods
--------------
    demo_provider.get_alerts()      → list[dict]
    demo_provider.get_flows()       → list[dict]
    demo_provider.get_sessions()    → list[dict]
    demo_provider.get_stats()       → dict

Demo data returns realistic, evolving values — not the same static
blob every call — so the frontend looks like a live SOC feed.
"""

import random
import threading
from datetime import datetime, timedelta


# ---------------------------------------------------------------------------
# Replay Scenarios — 6 distinct cyber attack types
# ---------------------------------------------------------------------------

_SCENARIOS = [
    # 0 — SQL Injection
    {
        "attack_type": "SQL Injection",
        "src_ip": "185.150.117.44",
        "dst_ip": "10.0.0.5",
        "protocol": "TCP",
        "severity": "CRITICAL",
        "country": "Russia",
        "dst_country": "Internal DMZ",
        "src_coords": {"lat": 55.7558, "lon": 37.6173},
        "dst_coords": {"lat": 0.0, "lon": 0.0},
        "src_domain": "unknown-host.ru",
        "dst_domain": "db-server-01.local",
        "detected_by": "XGBoost Core + Signature",
        "reason": (
            "CRITICAL THREAT DETECTED: Payload matches known SQLi signature patterns "
            "attempting to bypass authentication via tautology injections "
            "(' OR 1=1 --). Immediate firewall block recommended."
        ),
        "dst_port": 3306,
        "src_port_range": (10000, 60000),
        "packet_len_range": (800, 2000),
        "score_range": (95.0, 99.9),
        "flow_count": (8, 30),
        "byte_count": (5000, 50000),
    },
    # 1 — Port Scan
    {
        "attack_type": "Port Scan — SYN Flood",
        "src_ip": "91.199.212.58",
        "dst_ip": "192.168.1.1",
        "protocol": "TCP",
        "severity": "HIGH",
        "country": "Netherlands",
        "dst_country": "Internal Network",
        "src_coords": {"lat": 52.3676, "lon": 4.9041},
        "dst_coords": {"lat": 0.0, "lon": 0.0},
        "src_domain": "scan-node.nl",
        "dst_domain": "gateway.local",
        "detected_by": "RandomForest Volume Analyzer",
        "reason": (
            "HIGH THREAT DETECTED: SYN packets observed across 1,024 sequential "
            "destination ports within a 2-second window. Classic reconnaissance "
            "sweep — likely automated nmap-style scanner."
        ),
        "dst_port": 0,   # dynamic per scan
        "src_port_range": (10000, 60000),
        "packet_len_range": (40, 64),
        "score_range": (80.0, 94.0),
        "flow_count": (50, 200),
        "byte_count": (500, 5000),
    },
    # 2 — DDoS
    {
        "attack_type": "DDoS Threshold Breach",
        "src_ip": "45.133.192.10",
        "dst_ip": "10.0.0.12",
        "protocol": "UDP",
        "severity": "HIGH",
        "country": "China",
        "dst_country": "Internal Network",
        "src_coords": {"lat": 39.9042, "lon": 116.4074},
        "dst_coords": {"lat": 0.0, "lon": 0.0},
        "src_domain": "botnet-node.cn",
        "dst_domain": "workstation-12.local",
        "detected_by": "RandomForest Volume Analyzer",
        "reason": (
            "HIGH THREAT DETECTED: UDP flood sequence originating from a known "
            "botnet subnet. Volume exceeds baseline threshold by 4,000%. "
            "Suggesting upstream rate-limiting."
        ),
        "dst_port": 80,
        "src_port_range": (1024, 65535),
        "packet_len_range": (40, 64),
        "score_range": (88.0, 96.0),
        "flow_count": (200, 500),
        "byte_count": (100000, 500000),
    },
    # 3 — DNS Flood
    {
        "attack_type": "DNS Amplification Flood",
        "src_ip": "203.0.113.77",
        "dst_ip": "8.8.8.8",
        "protocol": "DNS",
        "severity": "MEDIUM",
        "country": "South Korea",
        "dst_country": "United States",
        "src_coords": {"lat": 37.5665, "lon": 126.9780},
        "dst_coords": {"lat": 37.7749, "lon": -122.4194},
        "src_domain": "reflector.kr",
        "dst_domain": "dns.google",
        "detected_by": "Isolation Forest (Anomaly Model)",
        "reason": (
            "MEDIUM THREAT DETECTED: Abnormally high rate of ANY-type DNS queries "
            "with spoofed source addresses. Classic DNS amplification attack vector "
            "targeting public resolvers."
        ),
        "dst_port": 53,
        "src_port_range": (1024, 65535),
        "packet_len_range": (60, 512),
        "score_range": (70.0, 86.0),
        "flow_count": (30, 100),
        "byte_count": (10000, 80000),
    },
    # 4 — Ransomware
    {
        "attack_type": "Ransomware Cryptographic Directory Sweep",
        "src_ip": "10.0.0.12",
        "dst_ip": "10.0.0.250",
        "protocol": "SMB",
        "severity": "CRITICAL",
        "country": "Internal Network",
        "dst_country": "Internal Storage",
        "src_coords": {"lat": 0.0, "lon": 0.0},
        "dst_coords": {"lat": 0.0, "lon": 0.0},
        "src_domain": "workstation-12.local",
        "dst_domain": "nas-backup-01.local",
        "detected_by": "Isolation Forest (Anomaly Model)",
        "reason": (
            "CRITICAL THREAT DETECTED: Highly anomalous lateral movement via SMB. "
            "Endpoint is rapidly scanning and modifying files on the NAS, indicating "
            "active ransomware encryption phase."
        ),
        "dst_port": 445,
        "src_port_range": (49152, 65535),
        "packet_len_range": (3000, 8000),
        "score_range": (97.0, 99.9),
        "flow_count": (5, 20),
        "byte_count": (50000, 300000),
    },
    # 5 — Botnet C2
    {
        "attack_type": "Botnet C2 Beacon",
        "src_ip": "172.16.5.34",
        "dst_ip": "94.130.55.22",
        "protocol": "HTTPS",
        "severity": "HIGH",
        "country": "Internal Network",
        "dst_country": "Germany",
        "src_coords": {"lat": 0.0, "lon": 0.0},
        "dst_coords": {"lat": 51.1657, "lon": 10.4515},
        "src_domain": "infected-host.local",
        "dst_domain": "c2-panel.de",
        "detected_by": "XGBoost Core + Signature",
        "reason": (
            "HIGH THREAT DETECTED: Periodic HTTPS beacon to a known C2 domain with "
            "a 30-second jitter pattern. Payload size is consistent with encrypted "
            "command polling. Host is likely part of an active botnet."
        ),
        "dst_port": 443,
        "src_port_range": (49152, 65535),
        "packet_len_range": (200, 800),
        "score_range": (85.0, 94.0),
        "flow_count": (3, 15),
        "byte_count": (1000, 10000),
    },
]


# ---------------------------------------------------------------------------
# ReplayScheduler — tracks position across calls
# ---------------------------------------------------------------------------

class ReplayScheduler:
    """
    Advances through the scenario list on each tick.
    Thread-safe. Wraps around so replay never ends.
    """

    def __init__(self, total: int):
        self._lock = threading.Lock()
        self._total = total
        self._index = 0
        self._tick = 0

    def next_indices(self, count: int) -> list:
        """Return `count` scenario indices, advancing the internal pointer."""
        with self._lock:
            indices = []
            for _ in range(count):
                indices.append(self._index % self._total)
                self._index = (self._index + 1) % self._total
            self._tick += 1
            return indices

    @property
    def tick(self) -> int:
        with self._lock:
            return self._tick


# ---------------------------------------------------------------------------
# ReplayEngine — builds rich alert/flow/session dicts from a scenario
# ---------------------------------------------------------------------------

class ReplayEngine:
    """
    Turns a raw scenario template into a fully populated alert/flow/session
    dict with realistic randomised values.
    """

    def __init__(self):
        self._scheduler = ReplayScheduler(total=len(_SCENARIOS))

    def _now(self, offset_seconds: int = 0) -> str:
        return (datetime.now() - timedelta(seconds=offset_seconds)).strftime("%H:%M:%S")

    def _build_alert(self, scenario: dict, offset_seconds: int = 0) -> dict:
        pkt_min, pkt_max = scenario["packet_len_range"]
        scr_min, scr_max = scenario["score_range"]
        src_port_min, src_port_max = scenario["src_port_range"]

        return {
            "id": f"EVT-DEMO-{random.randint(1000, 9999)}",
            "src_ip": scenario["src_ip"],
            "dst_ip": scenario["dst_ip"],
            "protocol": scenario["protocol"],
            "severity": scenario["severity"],
            "country": scenario["country"],
            "dst_country": scenario["dst_country"],
            "src_coords": scenario["src_coords"],
            "dst_coords": scenario["dst_coords"],
            "src_domain": scenario["src_domain"],
            "dst_domain": scenario["dst_domain"],
            "attack_type": scenario["attack_type"],
            "detected_by": scenario["detected_by"],
            "reason": scenario["reason"],
            "confidence": f"{round(random.uniform(scr_min, min(scr_max, 100.0)), 1)}%",
            "anomaly_score": round(random.uniform(scr_min, scr_max), 2),
            "packet_length": random.randint(pkt_min, pkt_max),
            "timestamp": self._now(offset_seconds),
        }

    def _build_flow(self, scenario: dict, offset_seconds: int = 0) -> dict:
        fc_min, fc_max = scenario["flow_count"]
        bc_min, bc_max = scenario["byte_count"]
        sp_min, sp_max = scenario["src_port_range"]

        dst_port = scenario["dst_port"]
        if dst_port == 0:
            dst_port = random.randint(1, 65535)

        return {
            "src_ip": scenario["src_ip"],
            "dst_ip": scenario["dst_ip"],
            "src_port": random.randint(sp_min, sp_max),
            "dst_port": dst_port,
            "protocol": scenario["protocol"],
            "packet_count": random.randint(fc_min, fc_max),
            "byte_count": random.randint(bc_min, bc_max),
            "timestamp": self._now(offset_seconds),
            "src_country": scenario["country"],
            "dst_country": scenario["dst_country"],
        }

    def _build_session(self, scenario: dict, offset_seconds: int = 0) -> dict:
        fc_min, fc_max = scenario["flow_count"]
        sp_min, sp_max = scenario["src_port_range"]

        dst_port = scenario["dst_port"]
        if dst_port == 0:
            dst_port = random.randint(1, 65535)

        src_port = random.randint(sp_min, sp_max)
        flow_count = random.randint(fc_min, fc_max)
        duration_sec = round(random.uniform(0.1, 30.0), 2)

        return {
            "session_key": (
                f"{scenario['src_ip']}:{src_port}->"
                f"{scenario['dst_ip']}:{dst_port}-{scenario['protocol']}"
            ),
            "src_ip": scenario["src_ip"],
            "dst_ip": scenario["dst_ip"],
            "src_country": scenario["country"],
            "dst_country": scenario["dst_country"],
            "start_time": self._now(offset_seconds + int(duration_sec)),
            "duration": f"{duration_sec}s",
            "flow_count": flow_count,
            "status": random.choice(["Active", "Active", "Closed"]),
        }

    # ------------------------------------------------------------------
    # Public snapshot builders — called by DemoProvider
    # ------------------------------------------------------------------

    def get_alerts(self, count: int = 5) -> list:
        indices = self._scheduler.next_indices(count)
        alerts = []
        for i, idx in enumerate(indices):
            alerts.append(self._build_alert(_SCENARIOS[idx], offset_seconds=i * 2))
        return alerts

    def get_flows(self, count: int = 8) -> list:
        indices = self._scheduler.next_indices(count)
        flows = []
        for i, idx in enumerate(indices):
            flows.append(self._build_flow(_SCENARIOS[idx], offset_seconds=i))
        return flows

    def get_sessions(self, count: int = 6) -> list:
        indices = self._scheduler.next_indices(count)
        sessions = []
        for i, idx in enumerate(indices):
            sessions.append(self._build_session(_SCENARIOS[idx], offset_seconds=i * 5))
        return sessions

    def get_stats(self, tick: int) -> dict:
        """
        Return realistic evolving stats that grow like a real capture session.
        Tick drives the numbers upward so stats feel live.
        """
        base_packets = 15000 + (tick * 47) + random.randint(-10, 10)
        base_flows   = 430   + (tick * 3)  + random.randint(-2, 2)
        base_sessions= 12    + (tick // 5) + random.randint(0, 1)
        base_alerts  = 2     + (tick // 3) + random.randint(0, 1)
        return {
            "packets":  max(0, base_packets),
            "flows":    max(0, base_flows),
            "sessions": max(0, base_sessions),
            "alerts":   max(0, base_alerts),
            "alerts_24h": max(0, base_alerts),
        }


# ---------------------------------------------------------------------------
# DemoProvider — the single entry point for all demo data
# ---------------------------------------------------------------------------

class DemoProvider:
    """
    Owns all demo/mock/replay data for ShadowSCAN Demo Mode.

    Import and use `demo_provider` (module-level singleton) everywhere.
    Never instantiate DemoProvider directly.
    """

    def __init__(self):
        self._engine = ReplayEngine()

    def get_alerts(self) -> list:
        """Return a fresh batch of replay alerts (5 per call, cycling through all 6 attack types)."""
        return self._engine.get_alerts(count=5)

    def get_flows(self) -> list:
        """Return a fresh batch of replay flows."""
        return self._engine.get_flows(count=8)

    def get_sessions(self) -> list:
        """Return a fresh batch of replay sessions."""
        return self._engine.get_sessions(count=6)

    def get_stats(self) -> dict:
        """Return evolving overview stats."""
        return self._engine.get_stats(tick=self._engine._scheduler.tick)


# ---------------------------------------------------------------------------
# Module-level singleton — import this everywhere
# ---------------------------------------------------------------------------
demo_provider = DemoProvider()
