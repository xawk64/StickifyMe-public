# syntax=docker/dockerfile:1

FROM node:22.19.0-alpine AS build
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 600000
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN yarn build

FROM node:22.19.0-alpine AS prod-deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production --network-timeout 600000

FROM node:22.19.0-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
COPY assets ./assets
COPY --chown=node:node uploads ./uploads
USER node
EXPOSE 4000
CMD ["node", "dist/index.js"]
