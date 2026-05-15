# ── Stage 1: Dependencies ─────────────────────────────────────────────────────
# Cached independently from source — only re-runs when package files change
FROM node:24-alpine AS deps
RUN npm install -g pnpm@11 --silent
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ── Stage 2: Lint ────────────────────────────────────────────────────────────
# Fails the build if ESLint violations are found
FROM deps AS lint
COPY . .
RUN pnpm run lint

# ── Stage 3: Type check ──────────────────────────────────────────────────────
# Fails the build if TypeScript/Astro type errors are found
FROM lint AS typecheck
RUN pnpm run typecheck

# ── Stage 4: Builder (default target) ───────────────────────────────────────
# DEFAULT WORKFLOW — this is all you need 90% of the time.
# Produces dist/ at container runtime so Docker secrets are available
# for the prebuild asset download script (GITHUB_TOKEN via entrypoint).
# Usage: docker compose build && docker compose up
#        dist/ is written to the ./output host volume and nginx is never involved.
FROM typecheck AS builder
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
CMD ["pnpm", "run", "build"]

# ── Stage 5: Static build for nginx ─────────────────────────────────────────
# OPTIONAL — only built when targeting the nginx server stage.
# Bakes dist/ into the image at build time using a BuildKit secret mount.
# The secret never persists in any image layer.
# Build with: docker compose --profile serve build
FROM typecheck AS build-static
RUN --mount=type=secret,id=github_token_password \
    export GITHUB_TOKEN=$(cat /run/secrets/github_token_password 2>/dev/null || true) && \
    pnpm run build

# ── Stage 6: Nginx server ───────────────────────────────────────────────────
# OPTIONAL — lean production image; no Node, no source, just nginx + dist/.
# ~25MB final image vs ~500MB+ with Node.
# Activate with: docker compose --profile serve build && docker compose --profile serve up -d
FROM nginx:alpine AS server
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build-static /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
