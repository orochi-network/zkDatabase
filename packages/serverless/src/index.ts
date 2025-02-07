import { ResolversApp, TypedefsApp } from '@apollo-app';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { nobodyContext } from '@common';
import {
  calculateAccessTokenDigest,
  config,
  headerToAccessToken,
  JwtAuthorization,
  logger,
  RedisInstance,
} from '@helper';
import { ModelOwnership, ModelUser } from '@model';
import { TApplicationContext, MinaNetwork } from '@zkdb/common';
import {
  DatabaseEngine,
  ModelMetadataDatabase,
  ModelRollupOffChain,
  ModelRollupOnChainHistory,
  ModelSecureStorage,
  ModelTransaction,
  TCompoundSession,
  Transaction,
} from '@zkdb/storage';
import { RedisStore } from 'connect-redis';
import cors from 'cors';
import { randomUUID } from 'crypto';
import express from 'express';
import fileupload from 'express-fileupload';
import session from 'express-session';
import helmet from 'helmet';
import http from 'http';
import { NetworkId } from 'o1js';

const EXPRESS_SESSION_EXPIRE_TIME = 86400;

(async () => {
  const app = express();
  // DB service
  const dbServerless = DatabaseEngine.getInstance(config.MONGODB_URL);
  // DB proof
  const dbProof = DatabaseEngine.getInstance(config.PROOF_MONGODB_URL);
  if (!dbServerless.isConnected()) {
    await dbServerless.connect();
  }

  if (!dbProof.isConnected()) {
    await dbProof.connect();
  }
  // For global Model that need to init index first
  await Transaction.compound(async (compoundSession: TCompoundSession) => {
    // service db
    await ModelTransaction.init(compoundSession.sessionServerless);
    await ModelUser.init(compoundSession.sessionServerless);
    await ModelMetadataDatabase.init(compoundSession.sessionServerless);
    await ModelRollupOnChainHistory.init(compoundSession.sessionServerless);
    await ModelOwnership.init(compoundSession.sessionServerless);
    // proof db
    await ModelSecureStorage.init(compoundSession.sessionMina);
    await ModelRollupOffChain.init(compoundSession.sessionMina);
  });

  MinaNetwork.getInstance().connect(
    // Since NETWORK_ID enum return {Testnet, Mainnet} so we need to lowercase and cast
    config.NETWORK_ID.toLocaleLowerCase() as NetworkId,
    config.MINA_URL,
    config.BLOCKBERRY_API_KEY
  );

  RedisInstance.event.on('error', logger.error);

  await RedisInstance.connect();

  app.use(express.json()).use(fileupload());

  const httpServer = http.createServer(app);
  const server = new ApolloServer<Partial<TApplicationContext>>({
    typeDefs: TypedefsApp,
    resolvers: ResolversApp,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    includeStacktraceInErrorResponses: true,
    logger,
  });

  app.use(
    helmet({
      crossOriginOpenerPolicy: false,
      contentSecurityPolicy: {
        directives: {
          // Default to self for all directives/resources
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            // Allow loading and executing Graphql Playground scripts from
            // cdn.apollographql.com
            'embeddable-sandbox.cdn.apollographql.com',
          ],
          // Allow loading Graphql Playground iframes from
          // embed.apollographql.com
          frameSrc: ["'self'", 'sandbox.embed.apollographql.com'],
          // Allow loading Graphql Playground images
          imgSrc: [
            "'self'",
            'apollo-server-landing-page.cdn.apollographql.com',
          ],
          // Allow loading Graphql Playground manifest
          manifestSrc: [
            "'self'",
            'apollo-server-landing-page.cdn.apollographql.com',
          ],
        },
      },
      // set the “X-Frame-Options” header to prevent clickjacking attacks
      frameguard: { action: 'deny' },
      // set the “X-XSS-Protection” header to prevent cross-site scripting (XSS) attacks
      xXssProtection: true,
      hsts: {
        // 30 days
        maxAge: 2592000,
        // removing the "includeSubDomains" option
        includeSubDomains: false,
      },
      // not loading the noSniff() middleware
      noSniff: false,
    })
  );

  await server.start();

  const redisStore = new RedisStore({
    client: RedisInstance.redis,
    prefix: 'zkdb-express-session-',
    // Sync expiration time in redis-store equal to the `expires` time in express-session cookie object
    ttl: EXPRESS_SESSION_EXPIRE_TIME,
  });

  app.use(
    session({
      genid: () => randomUUID(),
      store: redisStore,
      rolling: false, // force session not to reset expire time base on last call
      resave: false, // required: force lightweight session keep alive (touch)
      saveUninitialized: false, // recommended: only save session when data exists
      secret: config.EXPRESS_SESSION_SECRET,
      cookie: {
        path: '/',
        maxAge: EXPRESS_SESSION_EXPIRE_TIME * 1000,
      },
    })
  );

  app.use(
    '/graphql',
    cors<cors.CorsRequest>({
      origin: (_, callback) => {
        callback(null, true);
      },
      credentials: true,
    }),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        if (
          typeof req.headers.authorization === 'string' &&
          req.headers.authorization.startsWith('Bearer ')
        ) {
          const accessToken = headerToAccessToken(req.headers.authorization);
          const accessTokenDigest = calculateAccessTokenDigest(accessToken);
          const {
            payload: { userName, email },
          } = await JwtAuthorization.verify(accessToken);
          const serverRawSideAccessToken =
            await RedisInstance.accessTokenDigest(accessTokenDigest).get();

          const serverSideAccessToken =
            typeof serverRawSideAccessToken === 'string'
              ? JSON.parse(serverRawSideAccessToken)
              : serverRawSideAccessToken;

          if (serverSideAccessToken) {
            if (
              userName === serverSideAccessToken.userName &&
              serverSideAccessToken.email === email
            ) {
              return { sessionId: req.sessionID, userName, email, req };
            }
          }
        }

        return nobodyContext(req);
      },
    })
  );

  await new Promise<void>((resolve) => {
    httpServer.listen({ port: 4000 }, resolve);
  });

  logger.debug(
    `🚀 Server ready at http://${config.SERVICE_HOST}:${config.SERVICE_PORT}/graphql`
  );
  if (config.NODE_ENV !== 'production') {
    logger.warn('Server environment is:', config.NODE_ENV);
  }
})();
