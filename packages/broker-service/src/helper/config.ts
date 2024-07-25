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
  MONGODB_URL: string;
  PORT: number;
}

const configLoader = new ConfigLoader<TApplicationConfig>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (raw: any) => raw,
  {
    NODE_ENV: Joi.string()
      .required()
      .trim()
      .valid(...NODE_ENV_VALUES)
      .default("production"),
    MONGODB_URL: Joi.string()
      .trim()
      .required()
      .regex(/^mongodb([+a-z]+|):\/\//),
    PORT: Joi.number().integer().min(1).max(65535).required().default(4001),
  }
);

export const { config } = configLoader;
