import { ConfigLoader } from '@orochi-network/framework';
import Joi from 'joi';

export const NODE_ENV_VALUES = [
  'development',
  'production',
  'staging',
] as const;

type TNodeEnv = (typeof NODE_ENV_VALUES)[number];

interface TApplicationConfig {
  NODE_ENV: TNodeEnv;
  MONGODB_URL: string;
  SERVICE_JRPC_HOST: string;
  SERVICE_JRPC_PORT: number;
}

const configLoader = new ConfigLoader<TApplicationConfig>(
  (raw: any) => {
    const serviceUrl = new URL(raw.SERVICE_BIND);
    raw.SERVICE_HOST = serviceUrl.hostname;
    raw.SERVICE_PORT = parseInt(serviceUrl.port, 10);
    delete raw.SERVICE_BIND;
    return raw;
  },
  {
    NODE_ENV: Joi.string()
      .required()
      .trim()
      .valid(...NODE_ENV_VALUES)
      .default('production'),
    MONGODB_URL: Joi.string()
      .trim()
      .required()
      .regex(/^mongodb([+a-z]+|):\/\//),
    SERVICE_BIND: Joi.string()
      .pattern(/^http(|s):\/\//)
      .default('http://0.0.0.0:31337'),
  }
);

export const { config } = configLoader;
