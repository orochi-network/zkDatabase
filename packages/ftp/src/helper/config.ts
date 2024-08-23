/* eslint-disable no-param-reassign */
import { ConfigLoader } from "@orochi-network/framework";
import Joi from "joi";

export const NODE_ENV_VALUES = [
  "development",
  "production",
  "staging",
] as const;

type TNodeEnv = (typeof NODE_ENV_VALUES)[number];

interface TApplicationConfig {
  NODE_ENV: TNodeEnv;
  HOST_NAME: string;
  PORT: number;
  PASV_MIN: number;
  PASV_MAX: number;
}

const configLoader = new ConfigLoader<TApplicationConfig>((raw: any) => raw, {
  NODE_ENV: Joi.string()
    .required()
    .trim()
    .valid(...NODE_ENV_VALUES)
    .default("production"),
  HOST_NAME: Joi.string().required().trim().hostname(),
  PORT: Joi.number().integer().min(1).max(65535).required().default(2121),
  PASV_MIN: Joi.number().integer().min(1).max(65535).required(),
  PASV_MAX: Joi.number()
    .integer()
    .min(1)
    .max(65535)
    .required(),
});

export const { config } = configLoader;
