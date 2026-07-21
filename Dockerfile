FROM node:18 AS builder

WORKDIR /app

# Build @core/common -> tarball at /shared/core-common-1.0.0.tgz
COPY shared/package*.json shared/tsconfig.json shared/.npmignore /shared/
COPY shared/src/ /shared/src/
RUN cd /shared && npm install && npm run build && npm pack

# Install deps (file:../shared/core-common-1.0.0.tgz resolves to /shared/)
COPY api-server/package*.json api-server/.npmrc ./
RUN node -e "const fs=require('fs'),p='package-lock.json',l=JSON.parse(fs.readFileSync(p));if(l.packages&&l.packages['node_modules/@core/common'])delete l.packages['node_modules/@core/common'].integrity;fs.writeFileSync(p,JSON.stringify(l,null,2))" && npm ci

# Build service
COPY api-server/ ./
RUN npm run build

# --- Runner ---

FROM node:18-slim AS runner

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY api-server/public/ ./public/

ENV NODE_ENV=production
ENV ROOT_PATH=.
EXPOSE 5000

CMD ["node", "dist/main"]
