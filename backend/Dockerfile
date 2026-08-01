FROM node:18-alpine AS base
WORKDIR /app

FROM base AS deps
COPY backend/package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY backend/ .
RUN mkdir -p uploads && chown -R node:node /app

# NOTE: build this image with the repo ROOT as the Docker build context, e.g.:
#   docker build -f backend/Dockerfile -t pinnacle-backend .
# (docker-compose.yml at the repo root is already configured this way)
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/v1/health', r => process.exit(r.statusCode===200?0:1)).on('error', () => process.exit(1))"
CMD ["node", "server.js"]
