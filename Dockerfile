# ChordMiniApp Frontend Dockerfile
# Multi-stage build for optimized Next.js production deployment

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies needed for node-gyp and native modules
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package files and npm configuration
COPY package.json package-lock.json .npmrc ./

# Install dependencies with clean npm cache
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies needed for building
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package files and npm configuration, install all dependencies (including devDependencies)
COPY package.json package-lock.json .npmrc ./
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Copy production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Increase Node.js heap size for build (4GB)
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Build the application
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Optional build toggle for lyrics-sync source checkout.
# Keep disabled by default because the upstream project has a heavy dependency chain
# and is not distributed as a pip-installable package.
ARG LYRICS_SYNC_INSTALL=false

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install runtime dependencies including yt-dlp and ffmpeg for audio extraction
RUN apk add --no-cache \
    curl \
    git \
    python3 \
    py3-pip \
    ffmpeg \
    && pip3 install --no-cache-dir --break-system-packages yt-dlp \
        && if [ "$LYRICS_SYNC_INSTALL" = "true" ]; then \
            git clone --depth=1 https://github.com/mikezzb/lyrics-sync.git /opt/lyrics-sync; \
        fi \
    && rm -rf /var/cache/apk/*

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy essential runtime files
COPY --from=builder /app/package.json ./package.json

# Set correct permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV LYRICS_SYNC_ENABLED=false
ENV LYRICS_SYNC_PYTHON_BIN=python3
ENV PYTHONPATH=/opt/lyrics-sync

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "server.js"]
