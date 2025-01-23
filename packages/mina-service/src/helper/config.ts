import {
  ConfigLoader,
  NODE_ENV_VALUE,
  TNodeEnv,
} from '@orochi-network/framework';
import Joi from 'joi';
import { NetworkId } from 'o1js';

type TApplicationConfig = {
  NODE_ENV: TNodeEnv;
  MONGODB_URL: string;
  PROOF_MONGODB_URL: string;
  NETWORK_ID: NetworkId;
  REDIS_URL: string;
  MINA_URL: string;
  SERVICE_SECRET: string;
  BLOCKBERRY_API_KEY: string;
};

const configLoader = new ConfigLoader<TApplicationConfig>(
  (raw) => {
    /* eslint-disable no-param-reassign */
    raw.NETWORK_ID = raw.NODE_ENV === 'production' ? 'mainnet' : 'testnet';
    raw.MINA_URL =
      raw.NODE_ENV === 'production'
        ? 'https://api.minascan.io/node/mainnet/v1/graphql'
        : 'https://api.minascan.io/node/devnet/v1/graphql';
    return raw;
  },
  {
    NODE_ENV: Joi.string()
      .required()
      .trim()
      .valid(...NODE_ENV_VALUE)
      .default('production'),
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
    BLOCKBERRY_API_KEY: Joi.string().trim().required(),
  }
);

export const { config } = configLoader;
