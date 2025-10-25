# Chainlit ADK WYSIWYG - Podman/Docker Container
# Multi-stage build for Node.js frontend/backend + Python Chainlit

# =============================================================================
# Stage 1: Build Frontend and Backend
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY . .

# Build frontend and backend
RUN npm run build && \
    npm run build:backend

# =============================================================================
# Stage 2: Production Runtime
# =============================================================================
FROM node:20-alpine AS runtime

# Install Python and required system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    python3-dev \
    build-base \
    gcc \
    musl-dev \
    libffi-dev \
    openssl-dev \
    && ln -sf python3 /usr/bin/python

WORKDIR /app

# Copy Node.js dependencies from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Copy built artifacts
COPY --from=builder /app/dist ./dist

# Copy source files needed for runtime
COPY server ./server
COPY chainlit_app ./chainlit_app
COPY components ./components
COPY services ./services
COPY utils ./utils
COPY constants.ts ./constants.ts
COPY types.ts ./types.ts
COPY index.html ./index.html
COPY vite.config.ts ./vite.config.ts
COPY tsconfig*.json ./

# Create Python virtual environment and install Chainlit dependencies
RUN python3 -m venv /app/chainlit_app/.venv && \
    /app/chainlit_app/.venv/bin/pip install --no-cache-dir --upgrade pip

# Create a default requirements.txt if it doesn't exist
RUN echo "chainlit>=1.0.0" > /app/chainlit_app/requirements.txt && \
    echo "google-generativeai>=0.3.0" >> /app/chainlit_app/requirements.txt && \
    echo "python-dotenv>=1.0.0" >> /app/chainlit_app/requirements.txt && \
    /app/chainlit_app/.venv/bin/pip install --no-cache-dir -r /app/chainlit_app/requirements.txt

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose ports
# 3001 - Backend API
# 8000 - Chainlit Server
EXPOSE 3001 8000

# Environment variables
ENV NODE_ENV=production \
    BACKEND_PORT=3001 \
    CHAINLIT_PORT=8000 \
    PATH="/app/chainlit_app/.venv/bin:$PATH"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start script
COPY --chown=nodejs:nodejs scripts/container-start.sh /app/scripts/container-start.sh
RUN chmod +x /app/scripts/container-start.sh

CMD ["/app/scripts/container-start.sh"]
