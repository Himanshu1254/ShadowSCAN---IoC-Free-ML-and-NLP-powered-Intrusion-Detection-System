import requests


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

            url = f"http://ip-api.com/json/{ip}"

            response = requests.get(
                url,
                timeout=3
            )

            data = response.json()

            country = data.get(
                "country",
                "Unknown"
            )

            # 🔥 SAVE CACHE
            self.cache[ip] = country

            return country

        except Exception as e:

            print("[GEO-IP ERROR]")
            print(e)

            return "Unknown"