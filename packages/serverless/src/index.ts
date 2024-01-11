import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import fileupload from 'express-fileupload';
import http from 'http';
import cors from 'cors';
import logger from './helper/logger';
import { TypedefsApp, ResolversApp } from './apollo';
import { AppContext } from './helper/common';
import { config } from './helper/config';
import { DatabaseEngine } from './model/abstract/database-engine';
import { IJWTAuthenticationPayload, JWTAuthentication } from './helper/jwt';
import { ZKDATABAES_USER_NOBODY } from './common/const';

(async () => {
  const app = express();
  const dbEngine = DatabaseEngine.getInstance(config.mongodbUrl);
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
        if (req.headers.authorization) {
          const { sessionId, username, email } =
            await JWTAuthentication.verifyHeader<IJWTAuthenticationPayload>(
              req.headers.authorization
            );
          return { sessionId, username, email };
        }
        return {
          username: ZKDATABAES_USER_NOBODY,
          email: '',
          sessionId: '',
        };
      },
    })
  );

  await new Promise<void>((resolve) => {
    httpServer.listen({ port: 4000 }, resolve);
  });

  logger.debug(`🚀 Server ready at http://localhost:4000/graphql`);
})();
