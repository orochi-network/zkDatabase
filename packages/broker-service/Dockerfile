FROM node:22-slim

WORKDIR /usr/src/app

COPY . .

RUN yarn install --frozen-lockfile

RUN yarn workspace @zkdb/storage build

RUN yarn workspace @zkdb/broker-service build

WORKDIR /usr/src/app/packages/broker-service

CMD ["node", "build/src/index.js"]