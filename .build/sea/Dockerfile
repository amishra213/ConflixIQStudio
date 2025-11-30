FROM node:18-alpine

WORKDIR /app

# Copy the bundled application
COPY . .

# Ensure .filestore directory exists
RUN mkdir -p /app/.filestore

# Expose ports
EXPOSE 4000 5173

ENV NODE_ENV=production

# Start the application
CMD ["node", "index.js"]
