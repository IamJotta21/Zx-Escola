# ─── Stage 1: Development ─────────────────────────────────────────────────────
FROM node:20-alpine AS development

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm ci

# Copy prisma schema and generate client
COPY src/prisma/schema.prisma ./src/prisma/schema.prisma
RUN npx prisma generate --schema=src/prisma/schema.prisma

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

# ─── Stage 2: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY src/prisma/schema.prisma ./src/prisma/schema.prisma
RUN npx prisma generate --schema=src/prisma/schema.prisma

COPY . .
RUN npm run build

# ─── Stage 3: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy Prisma client and generated files
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy compiled output
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/prisma ./src/prisma

# Create uploads directory
RUN mkdir -p /app/src/uploads

EXPOSE 3000

# Run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy --schema=src/prisma/schema.prisma && node dist/server.js"]
