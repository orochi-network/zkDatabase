import {
  DatabaseEngine,
  ModelQueueTask,
  TransactionManager,
} from "@zkdb/storage";
import { ApolloServer } from "apollo-server-express";
import express from "express";
import http from "http";
import { ResolversApp, TypedefsApp } from "./apollo/index.js";
import { config, proofDb } from "./helper/config.js";
import logger from "./helper/logger.js";

(async () => {
  const app = express();

  if (!proofDb.isConnected()) {
    await proofDb.connect();
  }

  ModelQueueTask.createModel(proofDb);

  app.use(express.json());

  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    typeDefs: TypedefsApp,
    resolvers: ResolversApp,
    formatError: (error) => {
      logger.error(error);
      return error;
    },
  });

  await server.start();

  server.applyMiddleware({ app, path: "/graphql", cors: true });

  await new Promise<void>((resolve) => {
    httpServer.listen({ port: config.SERVICE_PORT }, resolve);
  });

  logger.debug(
    `🚀 Server ready at http://localhost:${config.SERVICE_PORT}/graphql`
  );
  if (config.NODE_ENV !== "production") {
    logger.warn("Server environment is:", config.NODE_ENV);
  }
})();
