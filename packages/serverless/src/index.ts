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
import { config } from './helper/config';
import { DatabaseEngine } from './model/abstract/database-engine';

(async () => {
  const app = express();
  await DatabaseEngine.getInstance(config.mongodbUrl).connect();
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
          //const { uuid } = await JWTAuthenInstance.verifyHeader(token);
        }
        return {};
      },
    })
  );

  await new Promise<void>((resolve) =>
    httpServer.listen({ port: 4000 }, resolve)
  );

  logger.debug(`🚀 Server ready at http://localhost:4000/graphql`);

  logger.debug(`🚀 Proxy ready at http://localhost:4000/kubo-proxy`);
})();
