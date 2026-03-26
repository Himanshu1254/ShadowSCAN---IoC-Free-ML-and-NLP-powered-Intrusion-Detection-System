import os

from engine.network.pcap_reader import PCAPReader
from engine.network.live_capture import LiveCapture
from features.flow_builder import FlowBuilder
from features.session_builder import SessionBuilder

# ✅ NEW IMPORT
from detection.detector_engine import DetectorEngine


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

        # ✅ NEW: ML Detector Engine
        self.detector_engine = DetectorEngine()

    # ---------------------------
    # UPDATED PIPELINE (ML ENABLED)
    # ---------------------------
    def run_once(self):
        raw_packets = self.reader.read()

        packets = []

        # Normalize packets
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
            except Exception:
                continue

        # Step 1: Build flows
        flows = self.flow_builder.build(packets)

        # Step 2: Build sessions
        sessions = self.session_builder.build(flows)

        # ✅ Step 3: ML Detection (REAL ALERTS)
        alerts = self.detector_engine.process_sessions(sessions)

        return {
            "packets": packets,
            "flows": flows,
            "sessions": sessions,
            "alerts": alerts,
        }