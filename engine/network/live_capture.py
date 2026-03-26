from scapy.all import sniff


class LiveCapture:
    """
    Live packet capture using Scapy.
    Captures a fixed window of packets.
    """

    def __init__(self, interface=None, packet_limit=100):
        self.interface = interface
        self.packet_limit = packet_limit

        print(f"[LiveCapture] Using interface: {self.interface}")
        print(f"[LiveCapture] Packet window size: {self.packet_limit}")

    def read(self):
        packets = sniff(
            iface=self.interface,
            count=self.packet_limit,
            store=True
        )
        return packets
