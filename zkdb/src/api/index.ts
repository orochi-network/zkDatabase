import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyparser from 'body-parser';
import logger from './helper/logger.js';
import { TypedefsApp, ResolversApp } from './apollo/index.js';
import loader from './helper/loader.js';
import { AppContext } from './helper/common.js';
import config from './helper/config.js';

(async () => {
  const app = express();
  const httpServer = http.createServer(app);
  const server = new ApolloServer<AppContext>({
    typeDefs: TypedefsApp,
    resolvers: ResolversApp,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    includeStacktraceInErrorResponses: true,
    logger,
  });

  await loader.getStorageEngine();

  await server.start();

  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    bodyparser.json(),
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
