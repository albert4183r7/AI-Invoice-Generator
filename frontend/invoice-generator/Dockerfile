# Stage 1: Build
FROM node:26-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Accept the argument from docker-compose
ARG VITE_API_BASE_URL
# Turn it into an env var so Vite can use it during build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY . .
RUN npm run build

# Stage 2: Serve
# The unprivileged nginx variant runs as a non-root uid and listens on 8080 by
# default, so nginx never needs to bind a privileged port -- and a container
# escape cannot reach the host as root.
FROM nginxinc/nginx-unprivileged:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Shared add_header snippet, included by each location that sets its own.
COPY security-headers.conf /etc/nginx/snippets/security-headers.conf

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
