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

# Accept build arguments for environment variables
ARG NODE_ENV=production
ARG PORT=8080
ARG DATABASE_URL
ARG JWT_SECRET
ARG API_KEY
ARG EXTERNAL_API_URL

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Copy public files to dist
RUN cp -r public/* dist/

# Change ownership to non-root user
RUN chown -R appuser:nodejs /app
USER appuser

# Remove dev dependencies to reduce image size (as non-root user)
RUN npm prune --production

# Expose port
EXPOSE 8080

# Set environment variables from build args
ENV NODE_ENV=$NODE_ENV
ENV PORT=$PORT
ENV DATABASE_URL=$DATABASE_URL
ENV JWT_SECRET=$JWT_SECRET
ENV API_KEY=$API_KEY
ENV EXTERNAL_API_URL=$EXTERNAL_API_URL

# Start the application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]