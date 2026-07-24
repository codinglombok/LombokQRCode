FROM node:18-alpine

WORKDIR /app

# Build stage
COPY package*.json tsconfig.build.json ./
COPY src ./src
RUN npm ci && npm run build

# Runtime stage — remove dev deps, keep only dist and production node_modules
RUN npm ci --only=production

# Expose port for the example Express server
EXPOSE 3000

# Copy example server
COPY examples/node/example.js ./

# Set NODE_ENV
ENV NODE_ENV=production

# Start the example server
CMD ["node", "example.js"]
