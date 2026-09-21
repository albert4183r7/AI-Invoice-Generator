# Use official Node.js image
FROM node:26-alpine

# Bake in production mode so the logger emits JSON rather than starting the
# pino-pretty transport (which is a dev-only dependency).
ENV NODE_ENV=production

# Set working directory
WORKDIR /app

# Copy package files first (for caching layers)
COPY package*.json ./

# Install dependencies (production only -- --omit=dev replaces the deprecated
# --only=production flag)
RUN npm ci --omit=dev

# Copy the rest of the application code, owned by the unprivileged user
COPY --chown=node:node . .

# Drop root. The node image already ships a `node` user, so a container escape
# lands on an unprivileged uid instead of root on the host.
USER node

# Expose the port the app runs on
EXPOSE 5000

# Probe the same endpoint an orchestrator will use, so `docker ps` reports the
# real state rather than just "running".
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5000/healthz || exit 1

# Run node directly rather than through `npm start`. npm does not reliably
# forward SIGTERM to its child, which would silently defeat the graceful
# shutdown in server.js -- the signal would reach npm and the app would never
# see it.
CMD ["node", "server.js"]
