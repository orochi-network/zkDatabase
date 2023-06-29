import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyparser from 'body-parser';
import logger from './helper/logger.js';
import { TypedefsApp, ResolversApp } from './apollo/index.js';
import getStorageEngine from './helper/ipfs-storage-engine.js';

const { json } = bodyparser;

interface MyContext {
  token?: String;
}

const app = express();
const httpServer = http.createServer(app);
const server = new ApolloServer<MyContext>({
  typeDefs: TypedefsApp,
  resolvers: ResolversApp,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  includeStacktraceInErrorResponses: true,
  logger,
});

await getStorageEngine();

await server.start();

app.use(
  '/graphql',
  cors<cors.CorsRequest>(),
  json(),
  expressMiddleware(server, {
    context: async ({ req }) => ({ token: req.headers.token }),
  })
);

await new Promise<void>((resolve) =>
  httpServer.listen({ port: 4000 }, resolve)
);

logger.debug(`🚀 Server ready at http://localhost:4000/graphql`);
