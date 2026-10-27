#!/bin/sh
set -eu
RACOTA_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
docker compose --project-directory "$RACOTA_ROOT" --env-file "$RACOTA_ROOT/.env.production" -f "$RACOTA_ROOT/compose.yaml" -f "$RACOTA_ROOT/compose.certificates.yaml" --profile certificates run --rm --no-deps certbot renew --cert-name racotagames.com --non-interactive
docker exec artexperts-nginx-1 nginx -t
docker exec artexperts-nginx-1 nginx -s reload
