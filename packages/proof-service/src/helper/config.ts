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
};

const configLoader = new ConfigLoader<TApplicationConfig>((raw) => raw, {
  NODE_ENV: Joi.string()
    .required()
    .trim()
    .valid(...NODE_ENV_VALUE)
    .default('production'),
  MONGODB_URL: Joi.string()
    .trim()
    .required()
    .regex(/^mongodb([+a-z]+|):\/\//),
  BROKER_SERVICE: Joi.string()
    .pattern(/^http(|s):\/\//)
    .default('http://0.0.0.0:31337'),
});

export const { config } = configLoader;
