import {
  ConfigLoader,
  NODE_ENV_VALUE,
  TNodeEnv,
} from '@orochi-network/framework';
import Joi from 'joi';

type TApplicationConfig = {
  NODE_ENV: TNodeEnv;
  MONGODB_URL: string;
  BROKER_SERVICE: string;
  PROOF_MONGODB_URL: string;
  NETWORK_ID: 'mainnet' | 'testnet';
  MINA_URL: string;
};

const configLoader = new ConfigLoader<TApplicationConfig>(
  (raw) => {
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
    BROKER_SERVICE: Joi.string()
      .pattern(/^http(|s):\/\//)
      .default('http://0.0.0.0:31337'),
  }
);

export const { config } = configLoader;
