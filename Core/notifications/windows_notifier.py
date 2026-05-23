from plyer import notification


class WindowsNotifier:

    def __init__(self):
        pass

    # --------------------------------------------------

    def send_alert(self, alert):

        try:

            title = "⚠ ShadowSCAN Alert"

            message = (
                f"{alert.get('attack_type')}\n"
                f"{alert.get('src_ip')} → {alert.get('dst_ip')}\n"
                f"Severity: {alert.get('severity')}"
            )

            notification.notify(
                title=title,
                message=message,
                timeout=5
            )

        except Exception as e:

            print("[NOTIFICATION ERROR]")
            print(e)