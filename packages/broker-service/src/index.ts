import express from "express";
import { DatabaseEngine } from "@zkdb/storage";
import { config } from "./helper/config.js";
import logger from "./helper/logger.js";
import http from "http";
import { ApolloServer } from "apollo-server-express";
import { TypedefsApp, ResolversApp } from "./apollo/index.js";

(async () => {
  const app = express();
  console.log("🚀 ~ config.PROOF_MONGODB_URL:", config.PROOF_MONGODB_URL);

  // DB service
  const serviceDb = DatabaseEngine.getInstance(config.MONGODB_URL);
  // DB proof
  const proofDb = DatabaseEngine.getInstance(config.PROOF_MONGODB_URL);
  if (!serviceDb.isConnected()) {
    await serviceDb.connect();
  }

  if (!proofDb.isConnected()) {
    await proofDb.connect();
  }

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
