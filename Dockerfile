# syntax=docker/dockerfile:1

ARG NODE_VERSION=22-slim

FROM node:${NODE_VERSION} AS dependencies
WORKDIR /app

COPY package.json package-lock.json .npmrc ./

RUN --mount=type=cache,target=/root/.npm \
  npm ci --no-audit --no-fund

FROM node:${NODE_VERSION} AS builder
WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production

RUN npm run build

FROM nginx:1.27-alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html/for-daria

EXPOSE 80
