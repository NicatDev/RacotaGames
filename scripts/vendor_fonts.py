"""Download official Google Fonts once; browser requests remain fully local."""

import re
from pathlib import Path
from urllib.request import Request, urlopen

root = Path(__file__).resolve().parent.parent
dest = root / "frontend" / "public" / "fonts"
dest.mkdir(parents=True, exist_ok=True)
url = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap"
request = Request(
    url,
    headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    },
)
css = urlopen(request, timeout=30).read().decode()
sources = list(dict.fromkeys(re.findall(r"https://fonts\.gstatic\.com/[^)\s]+", css)))
for i, source in enumerate(sources):
    extension = "woff2" if ".woff2" in source else "ttf"
    name = f"racota-font-{i+1}.{extension}"
    (dest / name).write_bytes(urlopen(source, timeout=30).read())
    css = css.replace(source, f"/fonts/{name}")
(dest / "fonts.css").write_text(css, encoding="utf-8")
for family in ["barlowcondensed", "manrope"]:
    license_url = (
        f"https://raw.githubusercontent.com/google/fonts/main/ofl/{family}/OFL.txt"
    )
    (dest / f"OFL-{family}.txt").write_bytes(urlopen(license_url, timeout=30).read())
print(f"Saved {len(sources)} official font files and their licenses locally.")
