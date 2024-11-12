/* eslint-disable no-param-reassign */
import { ConfigLoader } from '@orochi-network/framework';
import Joi from 'joi';

export const NODE_ENV_VALUES = [
  'development',
  'production',
  'staging',
] as const;

type TNodeEnv = (typeof NODE_ENV_VALUES)[number];

type TApplicationConfig = {
  NODE_ENV: TNodeEnv;
  MONGODB_URL: string;
  PROOF_MONGODB_URL: string;
};

const configLoader = new ConfigLoader<TApplicationConfig>((raw: any) => raw, {
  NODE_ENV: Joi.string()
    .optional()
    .trim()
    .default('production')
    .valid(...NODE_ENV_VALUES),
  MONGODB_URL: Joi.string()
    .trim()
    .required()
    .regex(/^mongodb([+a-z]+|):\/\//),
  PROOF_MONGODB_URL: Joi.string()
    .trim()
    .required()
    .regex(/^mongodb([+a-z]+|):\/\//),
});

export const { config } = configLoader;
