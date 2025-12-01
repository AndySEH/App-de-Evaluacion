# Dockerfile
# syntax=docker/dockerfile:1
FROM node:20-bullseye-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
  git ca-certificates python3 make g++ dumb-init \
  && rm -rf /var/lib/apt/lists/*

# Preinstall ngrok to avoid Expo prompt in non-interactive mode
RUN npm i -g @expo/ngrok@^4.1.0

WORKDIR /app

# Solo copiamos package.json para aprovechar el cache de Docker
COPY package*.json ./
RUN npm ci

# No copiamos el código aquí - se montará como volumen para hot reload

ENV NODE_ENV=development \
  EXPO_NO_TELEMETRY=1 \
  CHOKIDAR_USEPOLLING=1 \
  WATCHPACK_POLLING=true

EXPOSE 8081 19000 19001 19002 19006

CMD ["dumb-init", "npx", "expo", "start", "--host", "lan", "--non-interactive"]