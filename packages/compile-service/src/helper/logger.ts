import { LoggerLoader } from "@orochi-network/framework";
import { config } from "./config";
export const logger = new LoggerLoader(
  "zkDatabase",
  config.LOG_LEVEL,
  "string"
);
