import os

from engine.network.pcap_reader import PCAPReader
from engine.network.live_capture import LiveCapture
from features.flow_builder import FlowBuilder
from features.session_builder import SessionBuilder
from shadow_logging.logger import SessionLogger


class Pipeline:
    def __init__(
        self,
        mode: str = "live",
        pcap_path: str = None,
        interface: str = None,
        packet_limit: int = 100
    ):
        project_root = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..")
        )

        self.mode = mode

        if mode == "pcap":
            if pcap_path is None:
                pcap_path = os.path.join(project_root, "data", "raw", "dns.cap")

            self.reader = PCAPReader(pcap_path)

        elif mode == "live":
            self.reader = LiveCapture(
                interface=interface,
                packet_limit=packet_limit
            )

        else:
            raise ValueError("Invalid pipeline mode")

        self.flow_builder = FlowBuilder()
        self.session_builder = SessionBuilder()
        self.logger = SessionLogger()

    def run_once(self):
        raw_packets = self.reader.read()

        packets = []

        for pkt in raw_packets:
            try:
                if pkt.haslayer("IP"):
                    packets.append({
                        "timestamp": float(pkt.time),
                        "src_ip": pkt["IP"].src,
                        "dst_ip": pkt["IP"].dst,
                        "protocol": pkt["IP"].proto,
                        "packet_len": len(pkt)
                    })
            except:
                continue

        flows = self.flow_builder.build(packets)
        sessions = self.session_builder.build(flows)

        alerts = []

        for s in sessions:
            alerts.append({
                "type": "Suspicious Activity",
                "src_ip": s.get("src_ip"),
                "dst_ip": s.get("dst_ip"),
                "protocol": s.get("protocol"),
                "severity": "LOW",
                "confidence": "50%",
                "attack_type": "Unusual Access",
                "reason": "Detected unusual network behavior"
            })

        # 🔥 LOGGING
        self.logger.log_flows(flows)
        self.logger.log_sessions(sessions)
        self.logger.log_alerts(alerts)

        return {
            "packets": packets,
            "flows": flows,
            "sessions": sessions,
            "alerts": alerts,
        }