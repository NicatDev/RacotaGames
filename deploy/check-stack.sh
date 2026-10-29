#!/bin/sh
set -eu
RACOTA_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
sh "$RACOTA_ROOT/deploy/racota.sh" config --quiet
sh "$RACOTA_ROOT/deploy/racota.sh" exec -T racota-gateway nginx -t
sh "$RACOTA_ROOT/deploy/racota.sh" exec -T backend python manage.py check --deploy
sh "$RACOTA_ROOT/deploy/racota.sh" exec -T frontend node < "$RACOTA_ROOT/deploy/internal-checks.cjs"
