# syntax=docker/dockerfile:1

FROM node:22.19.0-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production --network-timeout 600000

FROM node:22.19.0-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=node:node . .
RUN mkdir -p uploads/avatars && chown -R node:node uploads
USER node
EXPOSE 4000
CMD ["node", "src/index.js"]
