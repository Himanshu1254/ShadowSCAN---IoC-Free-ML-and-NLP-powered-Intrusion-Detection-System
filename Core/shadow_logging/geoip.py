import requests
from ip2geotools.databases.noncommercial import DbIpCity

class GeoLocator:

    def __init__(self):
        self.cache = {}

    # --------------------------------------------------

    def get_country(self, ip):

        # 🔥 CACHE HIT
        if ip in self.cache:
            return self.cache[ip]

        try:
            # 🔥 LOCAL IPS
            if (
                ip.startswith("192.")
                or ip.startswith("10.")
                or ip.startswith("172.")
                or ip.startswith("127.")
            ):
                return "Local Network"

            # Use true Geo-IP resolution
            response = DbIpCity.get(ip, api_key='free')
            location = f"{response.city}, {response.country}" if response.city else response.country

            # 🔥 SAVE CACHE
            self.cache[ip] = location
            return location

        except Exception as e:
            # Fallback to ip-api if DbIpCity rate-limits or fails
            try:
                url = f"http://ip-api.com/json/{ip}"
                res = requests.get(url, timeout=3)
                data = res.json()
                country = data.get("country", "Unknown")
                self.cache[ip] = country
                return country
            except:
                print("[GEO-IP ERROR]")
                print(e)
                return "Unknown"