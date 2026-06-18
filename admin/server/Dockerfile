# --- dev: hot-reload target (source + deps bind-mounted by a compose override) ---
FROM node:20-alpine AS dev
WORKDIR /app
ENV NODE_ENV=development
EXPOSE 4000
CMD ["npm", "run", "dev"]

# --- prod (default build target) ---
FROM node:20-alpine AS prod
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

ENV NODE_ENV=production
EXPOSE 4000
CMD ["npm", "start"]
