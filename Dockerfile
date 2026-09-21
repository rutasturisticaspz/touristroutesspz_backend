# ------------------------------------------------------------
#  Backend REST — Rutas Turísticas Pérez Zeledón
#
#  Imagen multi-etapa: se compila con todas las dependencias y se
#  ejecuta con las de producción nada más. La imagen final no lleva
#  TypeScript, ni tsx, ni el código fuente.
# ------------------------------------------------------------

# --- Etapa 1: dependencias completas y compilación ---
FROM node:22-bookworm-slim AS build

# Prisma necesita openssl para sus binarios de consulta.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

# El código completo antes de generar el cliente: prisma.config.ts lee
# src/config/entorno.ts para saber a qué base apunta.
COPY . .

RUN npx prisma generate
RUN npm run build

# --- Etapa 2: sólo lo necesario para correr ---
FROM node:22-bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# El cliente generado de Prisma y el esquema: el cliente se genera
# contra la versión instalada, así que se copia desde la etapa de
# compilación en vez de volver a generarlo.
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist

# Carpeta de imágenes. En compose se monta encima como volumen; se crea
# aquí para que el contenedor arranque aunque no se monte nada.
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

# No correr como root.
USER node

EXPOSE 2999

CMD ["node", "dist/server.js"]
