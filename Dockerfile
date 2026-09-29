FROM node:24-alpine AS builder

WORKDIR /app

COPY api-server/package*.json ./
RUN npm install --legacy-peer-deps --ignore-scripts

COPY api-server-toolkit/package.json ./node_modules/api-server-toolkit/package.json
COPY api-server-toolkit/dist ./node_modules/api-server-toolkit/dist

COPY api-server/ .
RUN npx tsc -p tsconfig.build.json
RUN npm prune --production --legacy-peer-deps

# --- Runner ---

FROM node:24-alpine AS runner

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/tsconfig.json ./tsconfig.json

ENV NODE_ENV=production
ENV ROOT_PATH=.
USER node
EXPOSE 5000
HEALTHCHECK --interval=10s --timeout=3s --retries=5 --start-period=15s \
  CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["node", "-r", "tsconfig-paths/register", "dist/main"]
