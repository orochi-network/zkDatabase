import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import logger from './helper/logger';
import { TypedefsApp, ResolversApp } from './apollo';
import { AppContext } from './helper/common';
import config from './helper/config';
import { Connector } from '@orochi-network/framework';
import RedisInstance from './helper/redis';

(async () => {
  Connector.connectByUrl(config.mariadbConnectUrl);
  await RedisInstance.connect();
  const app = express();
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
      context: async ({ req }) => ({ token: req.headers.authorization }),
    })
  );

  await new Promise<void>((resolve) =>
    httpServer.listen({ port: 4000 }, resolve)
  );

  if (config.nodeEnv == 'development') {
    logger.warn(
      'Our environment is development, skip check for authentication'
    );
  }

  logger.debug(`🚀 Server ready at http://localhost:4000/graphql`);
})();
