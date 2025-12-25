# Multi-stage build for ConflixIQ Studio
# Stage 1: Build the React application
FROM node:20 AS builder

WORKDIR /app

# Copy package.json only (not package-lock.json to avoid npm optional deps bug)
COPY package.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY index.html ./

# Copy source code and resources
COPY src ./src
COPY resources ./resources

# Install dependencies and build (fresh install without lock file)
RUN npm install && npm run build

# Stage 2: Runtime environment
FROM node:20-alpine

WORKDIR /app

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

# Copy package.json only
COPY package.json ./

# Install production dependencies only (fresh install)
RUN npm install --omit=dev

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy backend files
COPY index.js ./
COPY fileStoreServer.js ./
COPY server-logger.js ./
COPY resolvers.js ./
COPY schema.js ./

# Create directories for file store and logs
RUN mkdir -p /app/.filestore /app/logs

# Expose ports
# 4000: Backend API server
# 5173: Frontend dev server (if needed)
EXPOSE 4000 5173

# Set NODE_ENV to production
ENV NODE_ENV=production

# Use dumb-init to handle signals
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start the application
CMD ["node", "index.js"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1
