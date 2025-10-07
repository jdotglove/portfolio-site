# Use Node.js 22 Alpine image
FROM node:22-alpine

# Update packages and install security patches
RUN apk update && apk upgrade && apk add --no-cache dumb-init

# Create non-root user first
RUN addgroup -g 1001 -S nodejs && adduser -S appuser -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Copy public files to dist
RUN cp -r public/* dist/

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Change ownership to non-root user
RUN chown -R appuser:nodejs /app
USER appuser

# Expose port
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Start the application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]