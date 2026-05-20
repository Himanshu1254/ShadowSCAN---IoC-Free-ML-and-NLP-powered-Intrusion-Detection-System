import requests
from loguru import logger


class ExplainabilityEngine:
    def __init__(self, ollama_host="http://localhost:11434", model_name="llama3"):
        self.ollama_url = f"{ollama_host}/api/generate"
        self.model = model_name
        self.llm_enabled = True  # Auto-toggles off if server is unreachable

    def _get_base_heuristics(self, session):
        """Extracts the raw technical triggers (Your original logic)."""
        reasons = []
        packet_count = session.get("packet_count", 0)
        flow_count = session.get("flow_count", 0)
        dst_port = session.get("dst_port", 0)
        duration = session.get("duration", 0)

        if packet_count > 500:
            reasons.append("High packet volume")
        if flow_count > 15:
            reasons.append("Excessive flow generation")
        if duration < 0.5:
            reasons.append("Burst communication behavior")
        if dst_port not in [80, 443, 53]:
            reasons.append(f"Unusual destination port ({dst_port})")

        if not reasons:
            reasons.append("General anomalous ML behavior")

        return reasons

    def explain(self, session, attack_type="Unknown Anomaly"):
        """Generates a dynamic explanation using Local AI, with a heuristic fallback."""

        # 1. Gather the raw facts
        base_reasons = self._get_base_heuristics(session)

        # 2. Skip AI generation for normal traffic to save CPU
        if attack_type == "Normal":
            return ["No anomaly detected"]

        # 3. Attempt to use Local AI for an advanced summary
        if self.llm_enabled:
            try:
                # Construct a strict prompt for the AI
                prompt = (
                    f"Act as a Senior SOC Analyst. An IDS just flagged a network flow as a '{attack_type}' attack. "
                    f"The technical triggers were: {', '.join(base_reasons)}. "
                    f"Write a single, concise 2-sentence explanation of why this is dangerous and what the attacker is attempting. "
                    f"Be direct. Do not use greetings or filler words."
                )

                payload = {"model": self.model, "prompt": prompt, "stream": False}

                # 2.5-second timeout ensures the NIDS doesn't lag if the AI is slow
                response = requests.post(self.ollama_url, json=payload, timeout=2.5)

                if response.status_code == 200:
                    ai_explanation = response.json().get("response", "").strip()
                    # Return the AI explanation alongside the raw facts
                    return [ai_explanation] + base_reasons

            except requests.exceptions.Timeout:
                logger.warning(
                    "[Explainability] Local AI took too long. Falling back to heuristics."
                )
            except requests.exceptions.ConnectionError:
                logger.warning(
                    "[Explainability] Local AI server not running on port 11434. Disabling AI features."
                )
                self.llm_enabled = (
                    False  # Disable to prevent constant lag on future packets
                )

        # 4. Fallback: If AI is off or failed, return the reliable heuristic reasons
        return base_reasons
