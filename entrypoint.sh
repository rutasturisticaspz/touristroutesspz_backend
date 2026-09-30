#!/bin/sh
set -e

# El volumen de imágenes se monta encima de /app/uploads y trae el
# dueño que tenga la carpeta en el servidor, que suele ser root. Así el
# backend puede leer las fotos pero no guardar las que se suben desde
# el panel (EACCES). Por eso el contenedor arranca como root sólo para
# ajustar el dueño de esa carpeta y después baja al usuario `node`.
DIR="${UPLOADS_DIR:-/app/uploads}"

if [ "$(id -u)" = "0" ]; then
  mkdir -p "$DIR"
  chown -R node:node "$DIR" || echo "Aviso: no se pudo cambiar el dueño de $DIR"
  exec setpriv --reuid=node --regid=node --init-groups "$@"
fi

exec "$@"
