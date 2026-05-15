# syntax=docker/dockerfile:1
# -----------------------------
# Stage 1: Builder
# -----------------------------
FROM node:20-alpine AS builder

WORKDIR /repo

# Workspace manifests (cache-friendly)
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/

# Install full workspace (Next build needs devDeps)
RUN npm ci --include-workspace-root

# Copy web sources
COPY apps/web ./apps/web

# Build Next.js (standalone output)
RUN npm run build -w trip-planner-web

# -----------------------------
# Stage 2: Runner
# -----------------------------
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S app && adduser -S app -G app

# Next standalone output already contains its own minimal node_modules
COPY --from=builder /repo/apps/web/.next/standalone ./
COPY --from=builder /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /repo/apps/web/public ./apps/web/public

USER app

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
