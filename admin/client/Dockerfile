# --- dev: hot-reload target (source + deps bind-mounted by a compose override) ---
FROM node:20-alpine AS dev
WORKDIR /app
EXPOSE 3000
CMD ["npm", "run", "dev"]

# --- prod build ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json vite.config.ts index.html ./
COPY src ./src
RUN npm run build

# --- serve static build with nginx (SPA fallback) ---
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3000
