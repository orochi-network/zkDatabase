/* eslint-disable no-param-reassign */
import {
  ConfigLoader,
  TNodeEnv,
  LoggerSet,
  LoggerLoader,
} from '@orochi-network/framework';
import { createHash } from 'crypto';
import Joi from 'joi';

LoggerSet(new LoggerLoader('framework', 'debug', 'json'));

interface TApplicationConfig {
  NODE_ENV: TNodeEnv;
  MONGODB_URL: string;
  REDIS_URL: string;
  EXPRESS_SESSION_SECRET: string;
  JWT_SECRET: string;
  PORT: number;
}

const configLoader = new ConfigLoader<TApplicationConfig>(
  (raw) => {
    const result: any = { ...raw };
    result.EXPRESS_SESSION_SECRET = createHash('sha256')
      .update('express-session')
      .update(raw.SERVICE_SECRET)
      .digest('base64');
    result.JWT_SECRET = createHash('sha256')
      .update('jwt')
      .update(raw.SERVICE_SECRET)
      .digest('base64');
    return result;
  },
  {
    NODE_ENV: Joi.string().optional().default('production'),
    MONGODB_URL: Joi.string()
      .trim()
      .required()
      .regex(/^mongodb([+a-z]+|):\/\//),
    REDIS_URL: Joi.string()
      .trim()
      .required()
      .regex(/^redis([+a-z]+|):\/\//),
    PORT: Joi.number().integer().min(1).max(65535).optional().default(4000),
    SERVICE_SECRET: Joi.string().base64().trim().required(),
  }
);

export const { config } = configLoader;

export default config;
