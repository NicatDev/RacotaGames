"""Create production secrets locally on the SERVER, without printing their values."""

import argparse
import os
import secrets
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument("--email", default="", help="Your Let's Encrypt contact email")
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
target = root / ".env.production"
if target.exists():
    raise SystemExit(
        ".env.production already exists; preserved. Edit it explicitly if needed."
    )
if args.email and ("@" not in args.email or any(c in args.email for c in "\r\n='\" ")):
    raise SystemExit("Provide a valid email address.")
content = (
    f"POSTGRES_PASSWORD={secrets.token_urlsafe(36)}\n"
    f"DJANGO_SECRET_KEY={secrets.token_urlsafe(64)}\n"
    "PROXY_NETWORK=artexperts_default\nIMAGE_TAG=local\nGUNICORN_WORKERS=2\n"
    f"LETSENCRYPT_EMAIL={args.email}\n"
)
fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as file:
    file.write(content)
print("Created .env.production with unique secrets. Values were not printed.")
