from scapy.all import sniff
from scapy.config import conf

# --- FORCE SCAPY TO USE THE NPCAP DRIVER ---
conf.use_pcap = True


class LiveCapture:
    """
    Live packet capture using Scapy.
    Captures a fixed window of packets.
    """

    def __init__(self, interface=None, packet_limit=100):
        # --- THE HIJACK: IGNORE PIPELINE PIPELINE CONFIGS ---
        self.interface = "Wi-Fi"
        self.packet_limit = packet_limit

        print(f"[LiveCapture] Using interface: {self.interface} (FORCED OVERRIDE)")
        print(f"[LiveCapture] Packet window size: {self.packet_limit}")

    def read(self):
        try:
            packets = sniff(
                iface=self.interface, count=self.packet_limit, store=True, timeout=2
            )
            return packets
        except Exception as e:
            print(f"\n[🚨 CRITICAL] LiveCapture Failed: {e}\n")
            return []
