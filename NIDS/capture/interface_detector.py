from scapy.all import get_if_list

def list_interfaces():
    interfaces = get_if_list()
    return [{"id": idx, "name": iface} for idx, iface in enumerate(interfaces)]

if __name__ == "__main__":
    for i in list_interfaces():
        print(i)
