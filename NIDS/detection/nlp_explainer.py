import requests
import random


class NLPExplainer:
    def __init__(self):
        # This is the default port where Ollama listens on your machine
        self.ollama_url = "http://localhost:11434/api/generate"
        self.model_name = "llama3:8b"  # Make sure this matches the model you pulled

    def explain(self, alert):
        attack = alert.get("attack_type", "Unknown")
        src = alert.get("src_ip", "Unknown")
        dst = alert.get("dst_ip", "Unknown")
        port = alert.get("dst_port", "Unknown")
        proto = alert.get("protocol", "Unknown")

        # Skip AI processing for generic/normal traffic to save your CPU
        if attack in ["Normal", "Unknown"]:
            return "Traffic parameters within normal operational thresholds."

        # The prompt that tells Llama 3 exactly how to behave
        prompt = (
            f"You are a tactical cybersecurity AI. Analyze this alert in ONE short, punchy sentence. "
            f"Attack: {attack}, Source: {src}, Destination: {dst}, Port: {port}, Protocol: {proto}."
        )

        try:
            # Send the request to local Ollama with a 3-second timeout so the pipeline doesn't freeze
            response = requests.post(
                self.ollama_url,
                json={"model": self.model_name, "prompt": prompt, "stream": False},
                timeout=3,
            )

            if response.status_code == 200:
                # Return the actual AI-generated text!
                return response.json().get("response", "").strip()
            else:
                print(f"[AI ERROR] Ollama returned status code: {response.status_code}")

        except requests.exceptions.Timeout:
            print("[AI TIMEOUT] Llama 3 was too slow to respond.")
        except requests.exceptions.ConnectionError:
            print("[AI ERROR] Could not connect to Ollama. Is it running?")
        except Exception as e:
            print(f"[AI ERROR] {e}")

        # The Fallback: If Ollama crashes or is too slow, we return a dynamic f-string
        return f"Warning: {attack} detected from {src} to {dst} on port {port}. (Local AI unreachable)."
