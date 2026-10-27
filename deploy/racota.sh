#!/bin/sh
# Always use Racota's exact project/env files, regardless of caller cwd.
set -eu
RACOTA_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
exec docker compose --project-directory "$RACOTA_ROOT" --env-file "$RACOTA_ROOT/.env.production" -f "$RACOTA_ROOT/compose.yaml" "$@"
