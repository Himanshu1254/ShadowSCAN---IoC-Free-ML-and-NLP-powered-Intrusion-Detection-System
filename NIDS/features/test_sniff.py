from scapy.all import sniff, conf
from scapy.arch.windows import get_windows_if_list

conf.use_pcap = True

print("=== SHADOWSCAN: THE REAL HUNT ===")
win_ifs = get_windows_if_list()
results = {}

for iface in win_ifs:
    name = iface.get("name", "Unknown")
    desc = iface.get("description", "")

    # Skip the obvious dead loopbacks, but check all real adapters
    if "Loopback" in name or "Pseudo" in name or "WFP" in desc:
        continue

    print(f"Listening to [{name}] for 2 seconds...")
    try:
        # No packet limit, just capture everything for 2 seconds
        pkts = sniff(iface=name, timeout=2)

        if len(pkts) > 50:  # We are looking for the 4K video flood
            results[name] = len(pkts)
            print(f"   -> 🔥 HEAVY TRAFFIC DETECTED: {len(pkts)} packets!")
        else:
            print(f"   -> {len(pkts)} packets. (Ignoring background noise)")
    except Exception as e:
        print(f"   -> Failed to bind.")

print("\n" + "=" * 40)
if results:
    best_iface = max(results, key=results.get)
    print(f"👑 THE TRUE ADAPTER IS: '{best_iface}' with {results[best_iface]} packets.")
    print("=" * 40)
else:
    print("CRITICAL: No heavy traffic found. Is the 4K video playing?")
