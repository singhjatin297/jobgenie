# ---------- Base Image ----------
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# ---------- Builder ----------
FROM base AS builder

# Install OS deps for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Copy package files first
COPY package.json pnpm-lock.yaml* ./

# Install ONLY prod deps
RUN pnpm install --frozen-lockfile

# Copy full app source
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build Next.js
RUN pnpm build

# ---------- Runner ----------
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

# Copy only required build artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public

# This one line fixes the "Query Engine not found" error forever with pnpm + Prisma 6
COPY --from=builder /app/node_modules/.pnpm/@prisma+engines@*/node_modules/@prisma/engines/libquery_engine-debian-openssl-3.0.x.so.node ./node_modules/.prisma/client/
EXPOSE 3000

CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm start"]
