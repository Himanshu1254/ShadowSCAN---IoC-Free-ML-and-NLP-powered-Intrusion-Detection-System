from scapy.all import sniff, IP, TCP, UDP
from scapy.config import conf
import time

# --- FORCE SCAPY TO USE THE NPCAP DRIVER ---
conf.use_pcap = True


class LiveSniffer:
    def __init__(self):
        self.buffer = []
        self.packet_count = 0

    def _on_packet(self, pkt):
        self.packet_count += 1
        # Print a tiny ping every 50 packets so we know it's alive
        if self.packet_count % 50 == 0:
            print(f"   -> [Sniffer] Rapidly caught {self.packet_count} packets...")

        if IP in pkt:
            proto = "OTHER"
            sport = None
            dport = None

            if TCP in pkt:
                proto = "TCP"
                sport = pkt[TCP].sport
                dport = pkt[TCP].dport
            elif UDP in pkt:
                proto = "UDP"
                sport = pkt[UDP].sport
                dport = pkt[UDP].dport

            record = {
                "timestamp": time.time(),
                "src_ip": pkt[IP].src,
                "dst_ip": pkt[IP].dst,
                "protocol": proto,
                "src_port": sport,
                "dst_port": dport,
                "packet_len": len(pkt),
            }

            self.buffer.append(record)

    def get_packets(self, limit=200):
        print("\n   -> [Sniffer] 1. get_packets() triggered.")
        self.buffer = []
        self.packet_count = 0

        try:
            print(
                f"   -> [Sniffer] 2. Booting Scapy sniff() on Wi-Fi (limit={limit}, timeout=2)..."
            )
            sniff(
                iface="Wi-Fi", prn=self._on_packet, store=False, count=limit, timeout=2
            )
            print(
                f"   -> [Sniffer] 3. sniff() finished successfully! Extracted {len(self.buffer)} IP records."
            )
        except Exception as e:
            print(f"   -> [SNIFFER CRASH] {e}")

        print("   -> [Sniffer] 4. Returning data to main pipeline.")
        return self.buffer
