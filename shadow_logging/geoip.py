import requests


class GeoIP:
    def __init__(self):
        self.cache = {}

    def get_country(self, ip):
        if ip in self.cache:
            return self.cache[ip]

        try:
            res = requests.get(f"http://ip-api.com/json/{ip}", timeout=2)
            data = res.json()

            country = data.get("country", "Unknown")

            self.cache[ip] = country
            return country

        except:
            return "Unknown"