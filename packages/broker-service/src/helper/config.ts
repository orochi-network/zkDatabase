import { ConfigLoader, Joi } from "@orochi-network/framework";
export const NODE_ENV_VALUES = [
  "development",
  "production",
  "staging",
] as const;

type TNodeEnv = (typeof NODE_ENV_VALUES)[number];

type TApplicationConfig = {
  NODE_ENV: TNodeEnv;
  MONGODB_URL: string;
  SERVICE_HOST: string;
  SERVICE_PORT: number;
  PROOF_MONGODB_URL: string;
};

const configLoader = new ConfigLoader<TApplicationConfig>(
  (raw) => {
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
      .default("production"),
    MONGODB_URL: Joi.string()
      .trim()
      .required()
      .regex(/^mongodb([+a-z]+|):\/\//),
    SERVICE_BIND: Joi.string()
      .pattern(/^http(|s):\/\//)
      .default("http://0.0.0.0:3000"),
    PROOF_MONGODB_URL: Joi.string()
      .trim()
      .required()
      .regex(/^mongodb([+a-z]+|):\/\//),
  }
);

export const { config } = configLoader;
