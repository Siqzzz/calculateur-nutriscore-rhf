FROM node:20-alpine AS base

WORKDIR /app

# ── DEV ────────────────────────────────────────────────────────────────────────
FROM base AS dev

# Les sources sont montées en volume
# node_modules est dans un volume séparé pour éviter les conflits Windows/Linux
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ── BUILD ──────────────────────────────────────────────────────────────────────
FROM base AS build

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── PROD ───────────────────────────────────────────────────────────────────────
FROM nginx:alpine AS prod

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
