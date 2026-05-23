class NetworkTokenizer:
    def __init__(self):
        # Vocabulary
        self.token_to_id = {}
        self.id_to_token = {}
        self._next_id = 1  # start from 1 (0 reserved for padding if needed)

    # ---------- Public API ----------

    def tokenize(self, session, local_ip=None):
        """
        session: session dict from SessionBuilder
        local_ip: optional, helps determine IN/OUT direction
        Returns: (token_str, token_id)
        """

        direction = self._get_direction(session, local_ip)
        proto = self._get_protocol(session)
        service = self._get_service(session)
        size = self._get_size_class(session)
        timing = self._get_time_class(session)

        token_str = f"{direction}_{proto}_{service}_{size}_{timing}"
        token_id = self._get_or_create_id(token_str)

        return {
            "token_str": token_str,
            "token_id": token_id
        }

    def vocab_size(self):
        return len(self.token_to_id)

    # ---------- Internal helpers ----------

    def _get_or_create_id(self, token):
        if token not in self.token_to_id:
            self.token_to_id[token] = self._next_id
            self.id_to_token[self._next_id] = token
            self._next_id += 1
        return self.token_to_id[token]

    def _get_direction(self, session, local_ip):
        """
        Determines OUT / IN / UNKNOWN
        """
        if local_ip is None:
            return "UNK"

        ip_a = session["endpoint_a"][0]
        ip_b = session["endpoint_b"][0]

        if ip_a == local_ip:
            return "OUT"
        elif ip_b == local_ip:
            return "IN"
        else:
            return "UNK"

    def _get_protocol(self, session):
        proto = session["protocol"]
        if proto == 6:
            return "TCP"
        elif proto == 17:
            return "UDP"
        else:
            return "OTHER"

    def _get_service(self, session):
        port_a = session["endpoint_a"][1]
        port_b = session["endpoint_b"][1]
        ports = {port_a, port_b}

        if 53 in ports:
            return "DNS"
        elif 80 in ports or 443 in ports:
            return "WEB"
        elif 22 in ports:
            return "SSH"
        elif 25 in ports:
            return "SMTP"
        else:
            return "OTHER"

    def _get_size_class(self, session):
        avg_pkt = session["total_bytes"] / max(session["packet_count"], 1)

        if avg_pkt < 100:
            return "SMALL"
        elif avg_pkt < 500:
            return "MEDIUM"
        else:
            return "LARGE"

    def _get_time_class(self, session):
        duration = session["duration"]

        if duration < 0.1:
            return "FAST"
        elif duration < 2.0:
            return "NORMAL"
        else:
            return "SLOW"
