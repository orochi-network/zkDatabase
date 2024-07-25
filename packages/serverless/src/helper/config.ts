/* eslint-disable no-param-reassign */
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
  REDIS_URL: string;
  PORT: number;
}

const configLoader = new ConfigLoader<TApplicationConfig>((raw: any) => raw, {
  NODE_ENV: Joi.string()
    .required()
    .trim()
    .valid(...NODE_ENV_VALUES)
    .default('production'),
  MONGODB_URL: Joi.string()
    .trim()
    .required()
    .regex(/^mongodb([+a-z]+|):\/\//),
  REDIS_URL: Joi.string()
    .trim()
    .optional()
    .regex(/^redis([+a-z]+|):\/\//),
  PORT: Joi.number().integer().min(1).max(65535).required().default(4000),
});

export const { config } = configLoader;
