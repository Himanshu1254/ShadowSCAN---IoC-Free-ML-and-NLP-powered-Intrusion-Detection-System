from collections import defaultdict
from datetime import datetime, timedelta


class SequenceBuilder:
    def __init__(self, window_seconds=300):
        """
        window_seconds: time window size for one sequence (default 5 minutes)
        """
        self.window = timedelta(seconds=window_seconds)

    def _parse_time(self, ts):
        return datetime.fromisoformat(ts)

    def build_sequences(self, sessions, tokenizer, local_ip):
        """
        sessions: list of session dicts
        tokenizer: NetworkTokenizer instance
        local_ip: host for which sequences are built

        Returns:
        [
          {
            "host": local_ip,
            "start_time": ...,
            "end_time": ...,
            "token_str_sequence": [...],
            "token_id_sequence": [...]
          },
          ...
        ]
        """

        # 1️⃣ Filter sessions involving local_ip
        relevant = []
        for s in sessions:
            ip_a = s["endpoint_a"][0]
            ip_b = s["endpoint_b"][0]
            if ip_a == local_ip or ip_b == local_ip:
                relevant.append(s)

        if not relevant:
            return []

        # 2️⃣ Sort by start time
        relevant.sort(key=lambda s: self._parse_time(s["start_time"]))

        sequences = []
        current_tokens_str = []
        current_tokens_id = []

        window_start = self._parse_time(relevant[0]["start_time"])
        window_end = window_start + self.window

        for session in relevant:
            ts = self._parse_time(session["start_time"])

            # Window expired → finalize current sequence
            if ts > window_end and current_tokens_str:
                sequences.append({
                    "host": local_ip,
                    "start_time": window_start.isoformat(),
                    "end_time": window_end.isoformat(),
                    "token_str_sequence": current_tokens_str,
                    "token_id_sequence": current_tokens_id
                })

                # Reset window
                current_tokens_str = []
                current_tokens_id = []
                window_start = ts
                window_end = window_start + self.window

            token = tokenizer.tokenize(session, local_ip=local_ip)
            current_tokens_str.append(token["token_str"])
            current_tokens_id.append(token["token_id"])

        # Final sequence
        if current_tokens_str:
            sequences.append({
                "host": local_ip,
                "start_time": window_start.isoformat(),
                "end_time": window_end.isoformat(),
                "token_str_sequence": current_tokens_str,
                "token_id_sequence": current_tokens_id
            })

        return sequences
