FROM node:21.6.1

WORKDIR /usr/src/app

COPY package.json yarn.lock .env ./

COPY packages/storage packages/storage
COPY packages/proof-service packages/proof-service

RUN yarn install --frozen-lockfile

RUN yarn workspace @zkdb/storage build

RUN yarn workspace @zkdb/proof-service build

WORKDIR /usr/src/app/packages/proof-service

CMD ["node", "build/index.js"]
