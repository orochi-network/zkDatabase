import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import fileupload from 'express-fileupload';
import http from 'http';
import cors from 'cors';
import logger from './helper/logger';
import { TypedefsApp, ResolversApp } from './apollo';
import { AppContext } from './helper/common';
import config from './helper/config';
import { Connector } from '@orochi-network/framework';
import RedisInstance from './helper/redis';
import JWTAuthenInstance from './helper/jwt';
import { ModelUser } from './model/user';
import kuboProxy from './kubo-proxy';
import { AppErrorClass } from './helper/response-error';

(async () => {
  Connector.connectByUrl(config.mariadbConnectUrl);
  await RedisInstance.connect();
  const app = express();
  app.use(express.json()).use(fileupload());

  const httpServer = http.createServer(app);
  const server = new ApolloServer<AppContext>({
    typeDefs: TypedefsApp,
    resolvers: ResolversApp,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    includeStacktraceInErrorResponses: true,
    logger,
  });

  await server.start();

  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const token = req.headers.authorization;
        if (token) {
          const { uuid } = await JWTAuthenInstance.verifyHeader(token);
          const imUser = new ModelUser();
          const [dbUser] = await imUser.get([{ field: 'uuid', value: uuid }]);
          if (dbUser)
            return {
              token,
              userId: dbUser.id,
            };
        }
        return {};
      },
    })
  );

  app.use('/kubo-proxy', kuboProxy);

  await new Promise<void>((resolve) =>
    httpServer.listen({ port: 4000 }, resolve)
  );

  logger.debug(`🚀 Server ready at http://localhost:4000/graphql`);

  logger.debug(`🚀 Proxy ready at http://localhost:4000/kubo-proxy`);
})();
