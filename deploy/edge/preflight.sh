#!/bin/sh
# Test the existing edge image with the additive config/mounts, without host ports.
set -eu
test -s /opt/racotagames/deploy/edge/racotagames.conf
test -s /opt/racotagames/deploy/edge/cloudflare-realip.conf
docker compose -p artexperts --project-directory /opt/artexperts \
    -f /opt/artexperts/compose.yaml \
    -f /opt/racotagames/deploy/edge/artexperts.racota.override.yaml \
    config --quiet
docker compose -p artexperts --project-directory /opt/artexperts \
    -f /opt/artexperts/compose.yaml \
    -f /opt/racotagames/deploy/edge/artexperts.racota.override.yaml \
    run --rm --no-deps nginx nginx -t
RACOTA_NGINX_DUMP=$(docker compose -p artexperts --project-directory /opt/artexperts \
    -f /opt/artexperts/compose.yaml \
    -f /opt/racotagames/deploy/edge/artexperts.racota.override.yaml \
    run --rm --no-deps nginx nginx -T 2>&1)
printf '%s\n' "$RACOTA_NGINX_DUMP" | grep -F 'server_name racotagames.com app.racotagames.com;' >/dev/null
unset RACOTA_NGINX_DUMP
echo 'Preflight passed. Existing running edge has not been changed.'
