# ── Build stage ──────────────────────────────────────
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json tsconfig.build.json ./
COPY src ./src
RUN npm ci && npm run build

# ── Runtime stage ────────────────────────────────────
FROM node:18-alpine

WORKDIR /app

# Copy built dist from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./

# Copy example server and install its runtime dependency
COPY examples/node/example.js ./
RUN npm init -y > /dev/null 2>&1 && npm install express lombokqrcode --save 2>/dev/null || true

# Fallback: link local dist as lombokqrcode so require('lombokqrcode') resolves
RUN mkdir -p node_modules/lombokqrcode && \
    cp -r dist node_modules/lombokqrcode/ && \
    cp package.json node_modules/lombokqrcode/

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "example.js"]
