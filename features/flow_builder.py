from collections import defaultdict


class FlowBuilder:
    """
    Builds 5-tuple flows from packet records.
    """

    def build(self, packets):
        flows = {}
        for pkt in packets:
            key = (
                pkt.get("src_ip"),
                pkt.get("dst_ip"),
                pkt.get("src_port"),
                pkt.get("dst_port"),
                pkt.get("protocol"),
            )

            if key not in flows:
                flows[key] = {
                    "src_ip": key[0],
                    "dst_ip": key[1],
                    "src_port": key[2],
                    "dst_port": key[3],
                    "protocol": key[4],
                    "packet_count": 1,
                    "byte_count": pkt.get("packet_len", 0),
                    "start_time": pkt.get("timestamp"),
                    "end_time": pkt.get("timestamp"),
                }
            else:
                f = flows[key]
                f["packet_count"] += 1
                f["byte_count"] += pkt.get("packet_len", 0)
                f["end_time"] = pkt.get("timestamp")

        return list(flows.values())
