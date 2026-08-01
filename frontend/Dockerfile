FROM node:18-alpine AS deps
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install --no-audit --no-fund

FROM deps AS build
WORKDIR /app
COPY frontend/ .
ARG VITE_API_URL=/api/v1
ARG VITE_SOCKET_URL=/
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
RUN npm run build

FROM nginx:1.27-alpine AS runner
COPY --from=build /app/dist /usr/share/nginx/html
COPY deployment/nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# NOTE: build this image with the repo ROOT as the Docker build context, e.g.:
#   docker build -f frontend/Dockerfile -t pinnacle-frontend .
# (docker-compose.yml at the repo root is already configured this way)
