FROM node:22-slim

WORKDIR /usr/src/app

COPY . .

RUN yarn install --frozen-lockfile

RUN yarn workspace ftp build

WORKDIR /usr/src/app/packages/ftp

CMD ["node", "build/src/index.js"]
