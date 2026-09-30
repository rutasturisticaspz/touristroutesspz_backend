#!/bin/sh
set -e

DIR="${UPLOADS_DIR:-/app/uploads}"

if [ "$(id -u)" = "0" ]; then
  mkdir -p "$DIR"
  chown -R node:node "$DIR" || echo "Aviso: no se pudo cambiar el dueño de $DIR"
  exec setpriv --reuid=node --regid=node --init-groups "$@"
fi

exec "$@"
