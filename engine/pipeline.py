import os

from engine.network.pcap_reader import PCAPReader
from engine.network.live_capture import LiveCapture
from features.flow_builder import FlowBuilder
from features.session_builder import SessionBuilder
from shadow_logging.logger import SessionLogger
from shadow_logging.geoip import GeoIP
from shadow_logging.domain_resolver import DomainResolver
from detection.detector_engine import DetectorEngine


class Pipeline:
    def __init__(
        self,
        mode="live",
        pcap_path=None,
        interface=None,
        packet_limit=100
    ):
        project_root = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..")
        )

        self.mode = mode

        if mode == "pcap":
            if pcap_path is None:
                pcap_path = os.path.join(project_root, "data/raw/dns.cap")
            self.reader = PCAPReader(pcap_path)

        else:
            self.reader = LiveCapture(interface=interface, packet_limit=packet_limit)

        self.flow_builder = FlowBuilder()
        self.session_builder = SessionBuilder()

        self.logger = SessionLogger()
        self.geoip = GeoIP()
        self.resolver = DomainResolver()
        self.detector = DetectorEngine()

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

        alerts = self.detector.process(sessions)

        enriched_alerts = []

        for a in alerts:
            country = self.geoip.get_country(a.get("src_ip"))
            domain = self.resolver.resolve(a.get("src_ip"))

            a["country"] = country
            a["domain"] = domain

            enriched_alerts.append(a)

        self.logger.log_flows(flows)
        self.logger.log_sessions(sessions)
        self.logger.log_alerts(enriched_alerts)

        return {
            "packets": packets,
            "flows": flows,
            "sessions": sessions,
            "alerts": enriched_alerts,
        }