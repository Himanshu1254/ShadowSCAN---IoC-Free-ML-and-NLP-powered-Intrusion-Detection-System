import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from engine.live_orchestrator import ShadowSCANOrchestrator


def main():
    orchestrator = ShadowSCANOrchestrator(
        local_ip="192.168.170.8"
    )

    print("Training baseline...")
    orchestrator.train_baseline_from_pcap(
        "data/raw/dns.cap"
    )

    print("\nRunning detection...")
    alerts = orchestrator.detect_from_pcap(
        "data/raw/dns.cap"
    )

    print("\nFINAL ALERT OUTPUT")
    print("=" * 60)

    if not alerts:
        print("No alerts (normal behavior)")
    else:
        for a in alerts:
            print(a)
            print("-" * 60)


if __name__ == "__main__":
    main()
