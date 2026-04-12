import socket


class DomainResolver:
    def __init__(self):
        self.cache = {}

    def resolve(self, ip):
        if ip in self.cache:
            return self.cache[ip]

        try:
            domain = socket.gethostbyaddr(ip)[0]
        except:
            domain = "Unknown"

        self.cache[ip] = domain
        return domain