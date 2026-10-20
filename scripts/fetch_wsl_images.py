import urllib.request
import re

url = "https://cloud-images.ubuntu.com/wsl/jammy/current/"
try:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        html = resp.read().decode("utf-8")
        links = re.findall(r'href=[\'"]([^\'"]+)[\'"]', html)
        print("Links in jammy/current:", [l for l in links if "tar" in l or "rootfs" in l or "wsl" in l])
except Exception as e:
    print("Error:", e)
