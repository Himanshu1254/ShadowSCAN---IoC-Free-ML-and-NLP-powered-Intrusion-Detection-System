class FeatureEngineer:

    def extract(self, session):

        packet_count = session.get(
            "packet_count",
            0
        )

        byte_count = session.get(
            "byte_count",
            0
        )

        duration = max(

            session.get(
                "duration",
                1
            ),

            0.001
        )

        flow_count = session.get(
            "flow_count",
            0
        )

        dst_port = session.get(
            "dst_port",
            0
        )

        # --------------------------------------------------
        # ENGINEERED FEATURES
        # --------------------------------------------------

        bytes_per_second = (

            byte_count / duration
        )

        packets_per_second = (

            packet_count / duration
        )

        avg_packet_size = (

            byte_count / max(
                packet_count,
                1
            )
        )

        flow_density = (

            flow_count / duration
        )

        burst_score = (

            packets_per_second * flow_count
        )

        port_is_common = (

            1

            if dst_port in [

                80,
                443,
                53

            ]

            else 0
        )

        # --------------------------------------------------

        features = {

            "packet_count":
                packet_count,

            "byte_count":
                byte_count,

            "duration":
                duration,

            "flow_count":
                flow_count,

            "dst_port":
                dst_port,

            "bytes_per_second":
                bytes_per_second,

            "packets_per_second":
                packets_per_second,

            "avg_packet_size":
                avg_packet_size,

            "flow_density":
                flow_density,

            "burst_score":
                burst_score,

            "port_is_common":
                port_is_common
        }

        return features