import {
  ConfigLoader,
  NODE_ENV_VALUE,
  TNodeEnv,
} from "@orochi-network/framework";
import Joi from "joi";

interface TApplicationConfig {
  NODE_ENV: TNodeEnv;
  HOST_NAME: string;
  PORT: number;
  PASV_MIN: number;
  PASV_MAX: number;
}

const configLoader = new ConfigLoader<TApplicationConfig>(
  (raw) => {
    const result = { ...raw };
    const serviceBindUrl = new URL(result.SERVICE_BIND);
    result.HOST_NAME = serviceBindUrl.hostname;
    result.PORT = parseInt(serviceBindUrl.port || "2121", 10);
    result.PASV_MIN = parseInt(
      serviceBindUrl.searchParams.get("pasvMin") || "1024",
      10
    );
    result.PASV_MIN = parseInt(
      serviceBindUrl.searchParams.get("pasvMax") || "2048",
      10
    );
    return result;
  },
  {
    NODE_ENV: Joi.string()
      .required()
      .trim()
      .valid(...NODE_ENV_VALUE)
      .default("production"),
    SERVICE_BIND: Joi.string().required().trim().uri(),
  }
);

export const { config } = configLoader;
