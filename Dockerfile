FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --production=false
COPY frontend/ ./
RUN npm run build

FROM node:18-alpine
WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./
RUN npm ci --production

# Copy backend source
COPY backend/src/ ./src/

# Copy frontend build
COPY --from=frontend-build /app/frontend/dist ./public/

# Create data directory
RUN mkdir -p /app/data

# Add static file serving to the backend
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/datapulse.db

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "src/index.js"]
