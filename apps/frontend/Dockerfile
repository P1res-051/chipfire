# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
# Observação: o package-lock pode não estar 100% sincronizado em branches de dev.
# Para evitar falhas do build no Docker por causa do `npm ci`, usamos `npm install`.
RUN npm install

FROM deps AS dev
COPY . .
EXPOSE 5173
CMD ["npm","run","dev"]

FROM deps AS build
ARG VITE_API_URL
ARG VITE_APP_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_URL=$VITE_APP_URL
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS prod
COPY ./infra-nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx","-g","daemon off;"]

