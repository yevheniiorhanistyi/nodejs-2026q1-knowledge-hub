FROM node:24-alpine AS build
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate
RUN npm run build

FROM node:24-alpine AS production
WORKDIR /usr/src/app
ENV NODE_ENV=production

RUN apk update && apk upgrade --no-cache

COPY package*.json ./

RUN npm install --omit=dev --legacy-peer-deps && \
    npm cache clean --force

COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma

RUN mkdir -p logs && chown -R node:node /usr/src/app

EXPOSE 4000

USER node

CMD ["node", "dist/main.js"]