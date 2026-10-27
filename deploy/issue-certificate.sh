#!/bin/sh
set -eu
RACOTA_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
if [ "$#" -ne 1 ]; then
    echo 'Usage: sh deploy/issue-certificate.sh YOUR_EMAIL' >&2
    exit 1
fi
if [ ! -s "$RACOTA_ROOT/deploy/secrets/cloudflare.ini" ]; then
    echo 'Create deploy/secrets/cloudflare.ini on the server with a scoped Cloudflare token.' >&2
    exit 1
fi
chmod 600 "$RACOTA_ROOT/deploy/secrets/cloudflare.ini"
docker volume inspect artexperts_certificates >/dev/null
exec docker compose --project-directory "$RACOTA_ROOT" --env-file "$RACOTA_ROOT/.env.production" -f "$RACOTA_ROOT/compose.yaml" -f "$RACOTA_ROOT/compose.certificates.yaml" --profile certificates run --rm --no-deps certbot certonly \
    --non-interactive --agree-tos --email "$1" \
    --dns-cloudflare --dns-cloudflare-credentials /run/secrets/cloudflare.ini \
    --dns-cloudflare-propagation-seconds 30 \
    --cert-name racotagames.com --keep-until-expiring \
    -d racotagames.com -d app.racotagames.com
