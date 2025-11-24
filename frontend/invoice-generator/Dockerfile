# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci

# --- ADD THESE LINES ---
# Accept the argument from docker-compose
ARG VITE_API_BASE_URL
# Turn it into an env var so Vite can use it during build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
# -----------------------

COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]