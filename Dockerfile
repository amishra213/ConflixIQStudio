# Multi-stage build for Conductor Designer
# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY index.html ./

# Copy source code
COPY src ./src
COPY static ./static

# Install dependencies and build
RUN npm ci && npm run build

# Stage 2: Runtime environment
FROM node:18-alpine

WORKDIR /app

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

# Copy package files for production dependencies
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy backend files
COPY index.js ./
COPY fileStoreServer.js ./
COPY resolvers.js ./
COPY schema.js ./

# Create directory for file store
RUN mkdir -p /app/.filestore

# Expose ports
# 4000: Backend API server
# 5173: Frontend dev server (if needed)
EXPOSE 4000 5173

# Set NODE_ENV to production
ENV NODE_ENV=production

# Use dumb-init to handle signals
ENTRYPOINT ["/usr/sbin/dumb-init", "--"]

# Start the application
CMD ["node", "index.js"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1
