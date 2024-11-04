/* eslint-disable no-param-reassign */
import { ConfigLoader, TLogLevel, TNodeEnv } from '@orochi-network/framework';
import { createHash } from 'crypto';
import Joi from 'joi';

export type TApplicationConfig = {
  NODE_ENV: TNodeEnv;
  OROCHI_LOG: TLogLevel;
};

const configLoader = new ConfigLoader<TApplicationConfig>(
  (raw) => {
    const result: any = { ...raw };
    return result;
  },
  {
    NODE_ENV: Joi.string().optional().default('production'),
    OROCHI_LOG: Joi.string().trim().default('debug')
  }
);

export const { config } = configLoader;

export default config;
