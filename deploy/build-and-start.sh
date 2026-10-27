#!/bin/sh
set -eu
RACOTA_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
docker network inspect artexperts_default >/dev/null
docker inspect artexperts-nginx-1 >/dev/null
sh "$RACOTA_ROOT/deploy/racota.sh" config --quiet
# Build sequentially to limit peak RAM on the shared 4 GB host.
sh "$RACOTA_ROOT/deploy/racota.sh" build backend
sh "$RACOTA_ROOT/deploy/racota.sh" build frontend
sh "$RACOTA_ROOT/deploy/racota.sh" up -d --wait --wait-timeout 180
sh "$RACOTA_ROOT/deploy/racota.sh" exec -T racota-gateway nginx -t
sh "$RACOTA_ROOT/deploy/racota.sh" ps
