# Node 22.18+ runs TypeScript directly (type stripping): no build step, no dependencies.
FROM node:22.19.0-alpine
WORKDIR /app
ENV NODE_ENV=production NODE_NO_WARNINGS=1
COPY package.json ./
COPY src ./src
USER node
EXPOSE 4010
HEALTHCHECK --interval=10s --timeout=3s CMD wget -qO- http://127.0.0.1:4010/health || exit 1
CMD ["node", "src/server.ts"]
