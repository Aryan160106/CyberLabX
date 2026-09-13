# Build context for this Dockerfile is frontend/ itself (not the repo root) --
# everything it needs lives inside this folder.

FROM node:22-slim AS builder
WORKDIR /app

RUN npm install -g pnpm@10.34.3

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
