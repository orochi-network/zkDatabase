import express from "express";
import { DatabaseEngine } from "@zkdb/storage";
import config from "./helper/config.js";
import logger from "./helper/logger.js";
import http from "http";
import { ApolloServer } from "apollo-server-express";
import { TypedefsApp, ResolversApp } from './apollo/index.js';

(async () => {
  const app = express();

  const dbEngine = DatabaseEngine.getInstance(config.mongodbUrl);
  if (!dbEngine.isConnected()) {
    await dbEngine.connect();
  }

  app.use(express.json());

  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    typeDefs: TypedefsApp,
    resolvers: ResolversApp,
    formatError: (error) => {
      logger.error(error);
      return error;
    }
  });

  await server.start();

  server.applyMiddleware({ app, path: '/graphql', cors: true });

  await new Promise<void>((resolve) => {
    httpServer.listen({ port: 4001 }, resolve);
  });

  logger.debug("🚀 Server ready at http://localhost:4000/graphql");
  if (config.nodeEnv !== "production") {
    logger.warn("Server environment is:", config.nodeEnv);
  }
})();
