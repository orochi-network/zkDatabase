import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import fileupload from 'express-fileupload';
import http from 'http';
import cors from 'cors';
import { DatabaseEngine } from '@zkdb/storage';
import logger from './helper/logger.js';
import { TypedefsApp, ResolversApp } from './apollo/index.js';
import { APP_CONTEXT_NOBODY, AppContext } from './common/types.js';
import { config } from './helper/config.js';
import { IJWTAuthenticationPayload, JWTAuthentication } from './helper/jwt.js';

(async () => {
  const app = express();
  const dbEngine = DatabaseEngine.getInstance(config.MONGODB_URL);
  if (!dbEngine.isConnected()) {
    await dbEngine.connect();
  }

  app.use(express.json()).use(fileupload());

  const httpServer = http.createServer(app);
  const server = new ApolloServer<Partial<AppContext>>({
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
        if (req.headers.authorization && req.headers.authorization !== '') {
          const { sessionId, userName, email } =
            await JWTAuthentication.verifyHeader<IJWTAuthenticationPayload>(
              req.headers.authorization
            );
          return { sessionId, userName, email };
        }
        return APP_CONTEXT_NOBODY;
      },
    })
  );

  await new Promise<void>((resolve) => {
    httpServer.listen({ port: 4000 }, resolve);
  });

  logger.debug('🚀 Server ready at http://localhost:4000/graphql');
  if (config.NODE_ENV !== 'production') {
    logger.warn('Server environment is:', config.NODE_ENV);
  }
})();
