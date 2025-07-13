# 1. Build Stage
FROM node:22 AS builder
WORKDIR /app

# Install dev & prod deps
COPY package*.json ./
RUN npm install

# Copy source & compile
COPY . .
RUN npm run build

# 2. Production Stage
FROM node:22-alpine
WORKDIR /app

# Only install prod deps
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled output
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"]
