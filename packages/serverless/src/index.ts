import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { DatabaseEngine } from '@zkdb/storage';
import RedisStore from 'connect-redis';
import cors from 'cors';
import { randomUUID } from 'crypto';
import express from 'express';
import fileupload from 'express-fileupload';
import session from 'express-session';
import helmet from 'helmet';
import http from 'http';
import { ResolversApp, TypedefsApp } from './apollo/index.js';
import { nobodyContext, TApplicationContext } from './common/types.js';
import { config } from './helper/config.js';
import { JwtAuthorization } from './helper/jwt.js';
import logger from './helper/logger.js';
import RedisInstance from './helper/redis.js';

const EXPRESS_SESSION_EXPIRE_TIME = 86400;

const generateSession = (req: express.Request) => {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) {
        reject(err);
      } else {
        resolve(err);
      }
    });
  });
};

(async () => {
  const app = express();
  const dbEngine = DatabaseEngine.getInstance(config.MONGODB_URL);
  if (!dbEngine.isConnected()) {
    await dbEngine.connect();
  }

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
      // enable playground apollo when environment is local
      contentSecurityPolicy: config.NODE_ENV !== 'local',
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
        httpOnly: true,
        path: '/',
        sameSite: 'strict',
        maxAge: Date.now() + EXPRESS_SESSION_EXPIRE_TIME * 1000,
      },
    })
  );

  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        logger.info(req.sessionID);
        if ((await RedisInstance.expressSession(req.sessionID).get()) == null) {
          await generateSession(req);
        }

        if (
          typeof req.headers.authorization === 'string' &&
          req.headers.authorization.startsWith('Bearer ')
        ) {
          const {
            payload: { userName, email },
          } = await JwtAuthorization.verify(
            // Remove "Bearer "
            req.headers.authorization.substring(7)
          );
          return { sessionId: req.sessionID, userName, email };
        }

        return nobodyContext(req);
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
