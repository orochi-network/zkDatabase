import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import { ConfigLoader, Singleton, Utilities } from '@orochi-network/framework';
import Joi from 'joi';

export const nodeEnvValue = ['development', 'production', 'staging'] as const;

type TNodeEnv = (typeof nodeEnvValue)[number];

interface IAppConfiguration {
  nodeEnv: TNodeEnv;
  hmacSecretKey: string;
  dataLocation: string;
  mariadbConnectUrl: string;
  googleLoginId: string;
  redisUrl: string;
}

export const envLocation = `${Utilities.File.getRootFolder(
  path.dirname(fileURLToPath(pathToFileURL(__filename).toString()))
)}/.env`;

const configLoader = Singleton<ConfigLoader>(
  'portal-service',
  ConfigLoader,
  envLocation,
  Joi.object<IAppConfiguration>({
    dataLocation: Joi.string().optional().trim(),
    nodeEnv: Joi.string()
      .required()
      .trim()
      .valid(...nodeEnvValue),
    hmacSecretKey: Joi.string().trim().required(),
    mariadbConnectUrl: Joi.string()
      .trim()
      .required()
      .regex(/^mysql:\/\//),
    googleLoginId: Joi.string().trim().required(),
    redisUrl: Joi.string().trim().required(),
  })
);

export const config: IAppConfiguration = configLoader.getConfig();

export default config;
