from scapy.all import rdpcap


class PCAPReader:
    def __init__(self, pcap_path: str):
        self.pcap_path = pcap_path

    def read(self):
        """
        Reads packets from a PCAP file and returns raw packet list.
        No metrics, no side effects.
        """
        packets = rdpcap(self.pcap_path)
        return packets
