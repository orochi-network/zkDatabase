import { ConfigLoader, Joi, TLogLevel } from "@orochi-network/framework";
export const NODE_ENV_VALUES = [
  "development",
  "production",
  "staging",
] as const;

type TNodeEnv = (typeof NODE_ENV_VALUES)[number];

type TApplicationConfig = {
  NODE_ENV: TNodeEnv;
  MONGODB_URL: string;
  NETWORK_ID: "mainnet" | "testnet";
  MINA_URL: string;
  LOG_LEVEL: TLogLevel;
};

const configLoader = new ConfigLoader<TApplicationConfig>(
  (raw) => {
    raw.NETWORK_ID = raw.NODE_ENV === "production" ? "mainnet" : "testnet";
    raw.MINA_URL =
      raw.NODE_ENV === "production"
        ? "https://api.minascan.io/node/mainnet/v1/graphq"
        : "https://api.minascan.io/node/devnet/v1/graphql";
    return raw;
  },
  {
    NODE_ENV: Joi.string()
      .required()
      .trim()
      .valid(...NODE_ENV_VALUES)
      .default("production"),
    LOG_LEVEL: Joi.string().trim().default("debug"),
    MONGODB_URL: Joi.string()
      .trim()
      .required()
      .regex(/^mongodb([+a-z]+|):\/\//),
    REDIS_URL: Joi.string()
      .trim()
      .required()
      .regex(/^redis([+a-z]+|):\/\//),
  }
);

export const { config } = configLoader;
