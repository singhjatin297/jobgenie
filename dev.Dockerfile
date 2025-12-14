FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

COPY package*.json ./
RUN pnpm install

# Copy Prisma schema before the rest so Docker caching works better
COPY prisma ./prisma

# Generate Prisma client
RUN pnpm prisma generate

# Copy the rest of the code
COPY . .

ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true
ENV WDS_SOCKET_PORT=0

EXPOSE 3000
# Run migrations/push when container starts (after DB is live)
# CMD ["sh", "-c", "pnpm prisma db push && pnpm dev"]
CMD ["sh", "-c", "pnpm prisma db push && pnpm dev"]

