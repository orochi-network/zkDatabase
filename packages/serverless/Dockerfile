FROM node:22-slim

WORKDIR /usr/src/app

COPY . .

RUN yarn install --frozen-lockfile

RUN yarn workspace @zkdb/serverless build

WORKDIR /usr/src/app/packages/serverless

CMD ["node", "build/src/index.js"]
