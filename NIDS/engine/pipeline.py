import os

from NIDS.engine.network.pcap_reader import PCAPReader
from NIDS.engine.network.live_capture import LiveCapture

from NIDS.features.flow_builder import FlowBuilder
from NIDS.features.session_builder import SessionBuilder

from Core.shadow_logging.logger import shadow_logger
from Core.shadow_logging.geoip import GeoLocator
from Core.shadow_logging.domain_resolver import DomainResolver

from NIDS.detection.detector_engine import DetectorEngine

class Pipeline:

    def __init__(
        self,
        mode="live",
        pcap_path=None,
        interface=None,
        packet_limit=100
    ):

        self._interface = interface
        self.packet_limit = packet_limit

        project_root = os.path.abspath(
            os.path.join(
                os.path.dirname(__file__),
                ".."
            )
        )

        self.mode = mode

        # --------------------------------------------------
        # DATA SOURCE
        # --------------------------------------------------

        if mode == "pcap":

            if pcap_path is None:

                pcap_path = os.path.join(
                    project_root,
                    "data/raw/dns.cap"
                )

            self.reader = PCAPReader(
                pcap_path
            )

        else:

            self.reader = LiveCapture(
                interface=self._interface,
                packet_limit=self.packet_limit
            )

        # (Moved property to bottom of class)

        # --------------------------------------------------
        # CORE MODULES
        # --------------------------------------------------

        self.flow_builder = FlowBuilder()

        self.session_builder = SessionBuilder()

        self.logger = shadow_logger

        self.geoip = GeoLocator()

        self.resolver = DomainResolver()

        self.detector = DetectorEngine()

        self.logger.log_pipeline("Pipeline initialized")

    @property
    def interface(self):
        return self._interface

    @interface.setter
    def interface(self, value):
        self._interface = value
        if self.mode == "live":
            self.reader = LiveCapture(
                interface=self._interface,
                packet_limit=self.packet_limit
            )

    # --------------------------------------------------
    # SMART NLP EXPLANATIONS
    # --------------------------------------------------

    def generate_explanation(
        self,
        alert,
        src_domain,
        dst_domain
    ):

        attack_type = alert.get(
            "attack_type"
        )

        protocol = alert.get(
            "protocol"
        )

        # --------------------------------------------------

        if attack_type == "ML Anomaly":

            return (
                f"Unusual traffic behavior detected between "
                f"{src_domain} and {dst_domain}. "
                f"This communication deviates from learned "
                f"normal patterns and may indicate suspicious "
                f"network behavior."
            )

        # --------------------------------------------------

        if protocol == 17:

            return (
                f"UDP communication observed between "
                f"{src_domain} and {dst_domain}. "
                f"Traffic characteristics appear irregular "
                f"and may require investigation."
            )

        # --------------------------------------------------

        if protocol == 6:

            return (
                f"TCP communication between "
                f"{src_domain} and {dst_domain} "
                f"shows abnormal session behavior which may "
                f"indicate scanning or probing activity."
            )

        # --------------------------------------------------

        return (
            f"Suspicious interaction detected between "
            f"{src_domain} and {dst_domain}. "
            f"The observed traffic pattern differs from "
            f"expected network behavior."
        )

    # --------------------------------------------------
    # MAIN PIPELINE LOOP
    # --------------------------------------------------

    def run_once(self):

        raw_packets = self.reader.read()

        packets = []

        # --------------------------------------------------
        # PACKET PARSING
        # --------------------------------------------------

        for pkt in raw_packets:
            try:
                if pkt.haslayer("IP"):
                    src_port = 0
                    dst_port = 0
                    if pkt.haslayer("TCP"):
                        src_port = pkt["TCP"].sport
                        dst_port = pkt["TCP"].dport
                    elif pkt.haslayer("UDP"):
                        src_port = pkt["UDP"].sport
                        dst_port = pkt["UDP"].dport

                    packets.append({
                        "timestamp": float(pkt.time),
                        "src_ip": pkt["IP"].src,
                        "dst_ip": pkt["IP"].dst,
                        "src_port": src_port,
                        "dst_port": dst_port,
                        "protocol": pkt["IP"].proto,
                        "packet_len": len(pkt)
                    })
            except Exception:
                continue

        # --------------------------------------------------
        # FLOW + SESSION BUILDING
        # --------------------------------------------------

        flows = self.flow_builder.build(
            packets
        )

        sessions = self.session_builder.build(
            flows
        )

        # --------------------------------------------------
        # DETECTION
        # --------------------------------------------------

        alerts = self.detector.process(
            sessions
        )

        # --------------------------------------------------
        # ALERT ENRICHMENT
        # --------------------------------------------------

        enriched_alerts = []

        for a in alerts:

            src_ip = a.get("src_ip")

            dst_ip = a.get("dst_ip")

            # --------------------------------------------------
            # GEO LOCATION
            # --------------------------------------------------

            src_country = self.geoip.get_country(
                src_ip
            )

            # --------------------------------------------------
            # DOMAIN LOOKUP
            # --------------------------------------------------

            src_domain = self.resolver.resolve(
                src_ip
            )

            dst_domain = self.resolver.resolve(
                dst_ip
            )

            # --------------------------------------------------
            # SMART EXPLANATION
            # --------------------------------------------------

            explanation = self.generate_explanation(
                a,
                src_domain,
                dst_domain
            )

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

            enriched_alerts.append(
                enriched_alert
            )

        # --------------------------------------------------
        # LOGGING
        # --------------------------------------------------

        self.logger.log_flows(flows)

        self.logger.log_sessions(sessions)

        self.logger.log_alerts(
            enriched_alerts
        )

        # --------------------------------------------------
        # ADDITIONAL ENRICHMENT FOR VISUALIZATIONS
        # --------------------------------------------------

        for pkt in packets:
            src_c = self.geoip.get_country(pkt.get("src_ip", ""))
            dst_c = self.geoip.get_country(pkt.get("dst_ip", ""))
            pkt["src_country"] = src_c
            pkt["dst_country"] = dst_c
            pkt["src_coords"] = self.geoip.get_coordinates(src_c)
            pkt["dst_coords"] = self.geoip.get_coordinates(dst_c)

        for f in flows:
            src_c = self.geoip.get_country(f.get("src_ip", ""))
            dst_c = self.geoip.get_country(f.get("dst_ip", ""))
            f["src_country"] = src_c
            f["dst_country"] = dst_c
            f["src_coords"] = self.geoip.get_coordinates(src_c)
            f["dst_coords"] = self.geoip.get_coordinates(dst_c)

        for s in sessions:
            src_c = self.geoip.get_country(s.get("src_ip", ""))
            dst_c = self.geoip.get_country(s.get("dst_ip", ""))
            s["src_country"] = src_c
            s["dst_country"] = dst_c
            s["src_coords"] = self.geoip.get_coordinates(src_c)
            s["dst_coords"] = self.geoip.get_coordinates(dst_c)

        # --------------------------------------------------
        # RETURN
        # --------------------------------------------------

        return {

            "packets": packets,

            "flows": flows,

            "sessions": sessions,

            "alerts": enriched_alerts,
        }