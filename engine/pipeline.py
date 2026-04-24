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

    def generate_explanation(self, alert, src_domain, dst_domain):
        attack_type = alert.get("attack_type")
        protocol = alert.get("protocol")

        if attack_type == "ML Anomaly":
            return (
                f"Unusual traffic behavior detected between {src_domain} and {dst_domain}. "
                f"This communication deviates from previously learned normal patterns, "
                f"indicating a potential anomaly in network behavior."
            )

        if protocol == 17:
            return (
                f"UDP-based communication observed between {src_domain} and {dst_domain}. "
                f"This may relate to DNS or streaming traffic, but irregular characteristics "
                f"have been detected."
            )

        if protocol == 6:
            return (
                f"TCP communication between {src_domain} and {dst_domain} shows unusual session patterns. "
                f"This may indicate scanning, probing, or abnormal connection behavior."
            )

        return (
            f"Suspicious interaction detected between {src_domain} and {dst_domain}. "
            f"The communication pattern does not align with expected network behavior."
        )

    def run_once(self):
        raw_packets = self.reader.read()

        packets = []

        # -------------------------------
        # PACKET PARSING
        # -------------------------------
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

        # -------------------------------
        # FLOW + SESSION BUILDING
        # -------------------------------
        flows = self.flow_builder.build(packets)
        sessions = self.session_builder.build(flows)

        # -------------------------------
        # DETECTION
        # -------------------------------
        alerts = self.detector.process(sessions)

        # -------------------------------
        # ENRICHMENT (FINAL CLEAN VERSION)
        # -------------------------------
        enriched_alerts = []

        for a in alerts:
            src_ip = a.get("src_ip")
            dst_ip = a.get("dst_ip")

            # GEO
            src_country = self.geoip.get_country(src_ip)

            # DOMAIN
            src_domain = self.resolver.resolve(src_ip)
            dst_domain = self.resolver.resolve(dst_ip)

            # SMART EXPLANATION
            explanation = self.generate_explanation(a, src_domain, dst_domain)

            enriched_alert = {
                "src_ip": src_ip,
                "dst_ip": dst_ip,
                "src_domain": src_domain,
                "dst_domain": dst_domain,
                "country": src_country,
                "protocol": a.get("protocol"),
                "severity": a.get("severity"),
                "confidence": a.get("confidence"),
                "attack_type": a.get("attack_type"),
                "reason": explanation
            }

            enriched_alerts.append(enriched_alert)

        # -------------------------------
        # LOGGING
        # -------------------------------
        self.logger.log_flows(flows)
        self.logger.log_sessions(sessions)
        self.logger.log_alerts(enriched_alerts)

        # -------------------------------
        # RETURN
        # -------------------------------
        return {
            "packets": packets,
            "flows": flows,
            "sessions": sessions,
            "alerts": enriched_alerts,
        }