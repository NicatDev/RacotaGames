#!/bin/sh
# Add a dedicated ingress network without removing existing edge connections.
set -eu
docker inspect artexperts-nginx-1 >/dev/null
if ! docker network inspect racota_edge >/dev/null 2>&1; then
    docker network create --driver bridge racota_edge >/dev/null
fi
RACOTA_EDGE_MEMBERSHIP=$(docker inspect artexperts-nginx-1 --format '{{range $name, $settings := .NetworkSettings.Networks}}{{println $name}}{{end}}')
if ! printf '%s\n' "$RACOTA_EDGE_MEMBERSHIP" | grep -Fx 'racota_edge' >/dev/null; then
    docker network connect racota_edge artexperts-nginx-1
fi
echo 'racota_edge is ready; existing Art Experts network connections are preserved.'
