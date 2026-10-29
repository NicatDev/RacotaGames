#!/bin/sh
# Migrate the broken shared-network setup using existing application images.
set -eu
RACOTA_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
sh "$RACOTA_ROOT/deploy/racota.sh" config --quiet
docker inspect racotagames-backend-1 racotagames-frontend-1 artexperts-nginx-1 >/dev/null
sh "$RACOTA_ROOT/deploy/ensure-edge-network.sh"

# Syntax validation uses a temporary gateway with no published host ports.
sh "$RACOTA_ROOT/deploy/racota.sh" run --rm --no-deps racota-gateway nginx -t

# Apply private aliases and move only Racota's gateway to the dedicated edge.
# No image builds, DB/Redis recreation, shared Nginx restart or volume removal.
sh "$RACOTA_ROOT/deploy/racota.sh" up -d --no-deps --no-build --pull never \
    --wait --wait-timeout 180 backend frontend racota-gateway
sh "$RACOTA_ROOT/deploy/check-stack.sh"
docker network inspect racota_edge --format '{{range .Containers}}{{println .Name}}{{end}}'
echo 'Gateway repair and internal checks passed. Next verify the public Nginx vhosts/HTTPS.'
