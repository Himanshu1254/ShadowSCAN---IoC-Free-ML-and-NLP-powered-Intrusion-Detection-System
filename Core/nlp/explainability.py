import requests
import json


class ThreatExplainer:
    def __init__(self, model_name="llama3"):
        self.model_name = model_name
        self.api_url = "http://localhost:11434/api/generate"
        self.timeout_seconds = 2.0  # Fast fail to prevent dashboard lag

    def generate_reasoning(self, features, prediction):
        """
        Queries the local Ollama LLM for a sub-15-word threat explanation.
        """
        if prediction == "Normal":
            return "Routine peripheral background noise. No anomalies hooked."

        prompt = f"""
        You are ShadowSCAN's autonomous cybersecurity AI. 
        Analyze this network threat:
        Attack Classification: {prediction}
        Vector Features: {features}
        
        Provide a highly technical, punchy reason why this was flagged.
        CRITICAL: Your response must be ONE sentence, maximum 15 words.
        """

        payload = {"model": self.model_name, "prompt": prompt, "stream": False}

        try:
            # Ping the local Ollama Matrix
            response = requests.post(
                self.api_url, json=payload, timeout=self.timeout_seconds
            )

            if response.status_code == 200:
                result = response.json()
                reasoning = result.get("response", "").strip()
                # Clean up any weird line breaks the LLM might hallucinate
                return reasoning.replace("\n", " ").replace("\r", "")
            else:
                return self._fallback_heuristic(prediction)

        except requests.exceptions.Timeout:
            return f"Heuristic Context: AI response timed out. High confidence {prediction} flow detected."
        except requests.exceptions.ConnectionError:
            return f"Heuristic Context: LLM Daemon offline. Volumetric anomalies match {prediction} signature."
        except Exception as e:
            return f"Heuristic Context: Pipeline syntax fallback for {prediction}."

    def _fallback_heuristic(self, prediction):
        """The Graceful Degradation mechanism."""
        heuristics = {
            "DDoS": "Massive ingress packet flood saturating inbound buffers.",
            "PortScan": "Sequential horizontal port probing originating from single node.",
            "Botnet": "Asymmetric command-and-control beaconing detected on non-standard ports.",
            "Infiltration": "Suspicious payload entropy combined with prolonged active session.",
        }
        return heuristics.get(
            prediction, f"Anomalous flow matrix aligning with {prediction} vectors."
        )
