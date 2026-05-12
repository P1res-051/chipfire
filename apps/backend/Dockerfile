FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

FROM base AS deps
ENV NODE_ENV=development
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm install

FROM deps AS dev
ENV NODE_ENV=development
COPY . .
EXPOSE 3000
CMD ["npm","run","start:dev"]

FROM deps AS build
ENV NODE_ENV=production
COPY . .
RUN rm -f tsconfig.build.tsbuildinfo && npm run build

FROM base AS prod
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
EXPOSE 3000
CMD ["node","dist/main"]
