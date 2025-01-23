 
import { ConfigLoader, TLogLevel, TNodeEnv } from '@orochi-network/framework';
import { ENetworkId } from '@zkdb/common';
import { createHash } from 'crypto';
import Joi from 'joi';

export type TApplicationConfig = {
  NODE_ENV: TNodeEnv;
  MONGODB_URL: string;
  REDIS_URL: string;
  EXPRESS_SESSION_SECRET: string;
  JWT_SECRET: string;
  SERVICE_HOST: string;
  SERVICE_PORT: number;
  SERVICE_ORIGIN: Map<string, boolean>;
  OROCHI_LOG: TLogLevel;
  PROOF_MONGODB_URL: string;
  NETWORK_ID: ENetworkId;
  BLOCKBERRY_API_KEY: string;
  MINA_URL: string;
};

const configLoader = new ConfigLoader<TApplicationConfig>(
  (raw) => {
    const result: any = { ...raw };
    result.NETWORK_ID =
      raw.NODE_ENV === 'production' ? ENetworkId.Mainnet : ENetworkId.Testnet;
    result.MINA_URL =
      raw.NODE_ENV === 'production'
        ? 'https://api.minascan.io/node/mainnet/v1/graphql'
        : 'https://api.minascan.io/node/devnet/v1/graphql';
    result.EXPRESS_SESSION_SECRET = createHash('sha256')
      .update('express-session')
      .update(raw.SERVICE_SECRET)
      .digest('base64');
    result.JWT_SECRET = createHash('sha256')
      .update('jwt')
      .update(raw.SERVICE_SECRET)
      .digest('base64');
    const { hostname, port } = new URL(raw.SERVICE_BIND);
    result.SERVICE_HOST = hostname;
    result.SERVICE_PORT = parseInt(port, 10);
    if (typeof raw.SERVICE_ALLOW_ORIGIN === 'string') {
      result.SERVICE_ORIGIN = new Map(
        raw.SERVICE_ALLOW_ORIGIN.split(';').map((e) => [e.trim(), true])
      );
    }
    return result;
  },
  {
    NODE_ENV: Joi.string().optional().default('production'),
    MONGODB_URL: Joi.string()
      .trim()
      .required()
      .regex(/^mongodb([+a-z]+|):\/\//),
    PROOF_MONGODB_URL: Joi.string()
      .trim()
      .required()
      .regex(/^mongodb([+a-z]+|):\/\//),
    REDIS_URL: Joi.string()
      .trim()
      .required()
      .regex(/^redis([+a-z]+|):\/\//),
    SERVICE_SECRET: Joi.string().base64().trim().required(),
    SERVICE_BIND: Joi.string().trim().default('http://0.0.0.0:4000'),
    // URL separated by ;
    SERVICE_ALLOW_ORIGIN: Joi.string().trim().default('http://localhost:4000/'),
    OROCHI_LOG: Joi.string().trim().default('debug'),
    BLOCKBERRY_API_KEY: Joi.string().trim().required(),
  }
);

export const { config } = configLoader;

export default config;
