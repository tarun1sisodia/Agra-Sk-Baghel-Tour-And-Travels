# Multi-stage production image for the SK Baghel Tour & Travels API.
#
# Stage contract:
#   deps      -> full dependency tree (incl. devDeps) used only for compilation
#   build     -> TypeScript -> dist
#   prod-deps -> pruned production dependency tree shipped to the runtime image
#   runner    -> minimal, non-root runtime image
#
# Keep the Node major in sync with backend/package.json "engines" and the
# NODE_VERSION used by .github/workflows/quality.yml.

FROM node:26-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:26-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# DevDependencies (typescript, vitest, eslint, tsx) never reach production.
FROM node:26-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:26-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S skb && adduser -S skb -G skb
COPY --from=prod-deps --chown=skb:skb /app/node_modules ./node_modules
COPY --from=build --chown=skb:skb /app/dist ./dist
COPY --chown=skb:skb package.json ./
COPY --chown=skb:skb migrations ./migrations
COPY --chown=skb:skb scripts/docker-entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh
USER skb
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/ready || exit 1
ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "dist/server.js"]
