FROM node:22-bookworm-slim AS application

WORKDIR /app

ENV NODE_ENV=development
ENV DATABASE_URL=postgresql://unused:unused@127.0.0.1:5432/unused
ENV DIRECT_URL=postgresql://unused:unused@127.0.0.1:5432/unused

COPY package.json package-lock.json ./
RUN npm ci

COPY nest-cli.json tsconfig.json tsconfig.build.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src
COPY public ./public

RUN npm run build

RUN mkdir -p /app/.data/published && chown -R node:node /app/.data

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

USER node

CMD ["node", "dist/main.js"]
