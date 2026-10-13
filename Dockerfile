# ------------------------------------------------------------
#  REST backend — Rutas Turísticas Pérez Zeledón
#
#  Multi-stage image: it is built with all dependencies and runs with
#  production ones only. The final image carries no TypeScript, no
#  tsx and no source code.
# ------------------------------------------------------------

# --- Stage 1: full dependencies and build ---
FROM node:22-bookworm-slim AS build

# Prisma needs openssl for its query engine binaries.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

# The full source goes in before generating the client: prisma.config.ts
# reads src/config/entorno.ts to know which database to point at.
COPY . .

RUN npx prisma generate
RUN npm run build

# --- Stage 2: only what is needed to run ---
FROM node:22-bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# The generated Prisma client and the schema: the client is generated
# against the installed version, so it is copied from the build stage
# instead of generating it again.
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist

# Images folder. In compose a volume is mounted over it; it is created
# here so the container starts even if nothing is mounted.
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

COPY entrypoint.sh /usr/local/bin/entrypoint-rutas.sh
RUN chmod +x /usr/local/bin/entrypoint-rutas.sh

EXPOSE 2999

ENTRYPOINT ["/usr/local/bin/entrypoint-rutas.sh"]
CMD ["node", "dist/server.js"]
