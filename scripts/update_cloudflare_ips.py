"""Regenerate per-vhost trusted Cloudflare ranges from the official endpoints."""

import ipaddress
from pathlib import Path
from urllib.request import Request, urlopen

ranges = []
for family in ["v4", "v6"]:
    request = Request(
        f"https://www.cloudflare.com/ips-{family}",
        headers={"User-Agent": "Mozilla/5.0"},
    )
    data = urlopen(request, timeout=20).read().decode()
    for value in data.split():
        ranges.append(str(ipaddress.ip_network(value, strict=True)))
if len(ranges) < 10:
    raise SystemExit("Unexpected response; existing file preserved.")
target = Path(__file__).resolve().parent.parent / "deploy/edge/cloudflare-realip.conf"
target.write_text(
    "# Official https://www.cloudflare.com/ips/ ranges; scoped to Racota vhosts only.\n"
    + "".join(f"set_real_ip_from {network};\n" for network in ranges)
    + "real_ip_header CF-Connecting-IP;\nreal_ip_recursive on;\n",
    encoding="utf-8",
    newline="\n",
)
print(f"Saved {len(ranges)} official Cloudflare ranges.")
