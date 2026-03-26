# backend/features/session_builder.py

import time
from typing import List, Dict


class SessionBuilder:
    def __init__(self, session_timeout: int = 60):
        self.session_timeout = session_timeout

    def build(self, flows: List[Dict]) -> List[Dict]:
        sessions = {}
        now = time.time()

        for flow in flows:
            key = (
                flow.get("src_ip"),
                flow.get("dst_ip"),
                flow.get("src_port"),
                flow.get("dst_port"),
                flow.get("protocol"),
            )

            flow_start = flow.get("start_time") or now
            flow_end = flow.get("end_time") or now
            packet_count = flow.get("packet_count") or 0
            byte_count = flow.get("byte_count") or 0

            if key not in sessions:
                sessions[key] = {
                    "session_id": f"{key[0]}:{key[2]}->{key[1]}:{key[3]}-{key[4]}",
                    "src_ip": key[0],
                    "dst_ip": key[1],
                    "src_port": key[2],
                    "dst_port": key[3],
                    "protocol": key[4],
                    "start_time": flow_start,
                    "end_time": flow_end,
                    "flow_count": 1,
                    "packet_count": packet_count,
                    "byte_count": byte_count,
                    "last_seen": now,
                }
            else:
                s = sessions[key]
                s["flow_count"] += 1
                s["packet_count"] += packet_count
                s["byte_count"] += byte_count

                # Safe timestamp handling
                s["end_time"] = max(
                    s.get("end_time") or now,
                    flow_end
                )

                s["last_seen"] = now

        active_sessions = []
        for s in sessions.values():
            if now - s["last_seen"] <= self.session_timeout:
                active_sessions.append(s)

        return active_sessions
