from scapy.all import sniff, IP, TCP, UDP
import time


class LiveSniffer:
    def __init__(self):
        self.buffer = []

    def _on_packet(self, pkt):
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
                "packet_len": len(pkt)
            }

            self.buffer.append(record)

    def get_packets(self, limit=200):
        self.buffer = []
        sniff(prn=self._on_packet, store=False, count=limit)
        return self.buffer
