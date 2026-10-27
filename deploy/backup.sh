#!/bin/sh
set -eu
RACOTA_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
umask 077
RACOTA_STAMP=$(date -u +%Y%m%dT%H%M%SZ)
RACOTA_BACKUP="$RACOTA_ROOT/backups/$RACOTA_STAMP"
mkdir -p "$RACOTA_BACKUP"
sh "$RACOTA_ROOT/deploy/racota.sh" exec -T db pg_dump -U racota -d racota -Fc > "$RACOTA_BACKUP/database.dump"
sh "$RACOTA_ROOT/deploy/racota.sh" exec -T backend tar -C /app/media -czf - . > "$RACOTA_BACKUP/media.tar.gz"
echo "Racota database/media backup: $RACOTA_BACKUP"
echo 'Copy this directory and your production secrets to protected off-server storage.'
