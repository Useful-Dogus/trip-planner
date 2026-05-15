# syntax=docker/dockerfile:1
# -----------------------------
# Stage 1: Builder
# -----------------------------
FROM node:20-alpine AS builder

WORKDIR /repo

# Copy workspace manifests first to maximize layer caching
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install full workspace (we need devDeps for the NestJS build)
RUN npm ci --include-workspace-root

# Copy api sources + per-app configs
COPY apps/api ./apps/api

# Build
RUN npm run build -w @trip-planner/api

# -----------------------------
# Stage 2: Runner
# -----------------------------
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S app && adduser -S app -G app

# Production-only deps (install at the workspace root so workspace resolution still works)
COPY --from=builder /repo/package.json /repo/package-lock.json ./
COPY --from=builder /repo/apps/api/package.json ./apps/api/
COPY --from=builder /repo/apps/web/package.json ./apps/web/
RUN npm ci --include-workspace-root --omit=dev && npm cache clean --force

# Compiled output
COPY --from=builder /repo/apps/api/dist ./apps/api/dist

USER app

EXPOSE 3001

CMD ["node", "apps/api/dist/main.js"]
