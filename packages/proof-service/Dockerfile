FROM orochinetwork/node:20-iron

RUN groupadd -r appuser && useradd -r -g appuser -s /bin/bash -d /usr/src/app appuser

WORKDIR /usr/src/app

RUN chown -R appuser:appuser /usr/src/app

USER appuser

COPY --chown=appuser:appuser . .

RUN yarn install --frozen-lockfile

RUN yarn workspace @zkdb/storage build

RUN yarn workspace @zkdb/proof-service build

WORKDIR /usr/src/app/packages/proof-service

ENTRYPOINT ["node", "build/src/index.js"]