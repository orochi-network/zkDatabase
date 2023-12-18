import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import { ConfigLoader, Singleton, Utilities } from '@orochi-network/framework';
import Joi from 'joi';

export const nodeEnvValue = ['development', 'production', 'staging'] as const;

type TNodeEnv = (typeof nodeEnvValue)[number];

interface IAppConfiguration {
  nodeEnv: TNodeEnv;
  merkle: string;
  mongodbUrl: string;
  redisUrl: string;
}

export const envLocation = `${Utilities.File.getRootFolder(
  path.dirname(fileURLToPath(pathToFileURL(__filename).toString()))
)}/.env`;

console.log(envLocation);

const configLoader = Singleton<ConfigLoader>(
  'zkdb-aas',
  ConfigLoader,
  envLocation,
  Joi.object<IAppConfiguration>({
    nodeEnv: Joi.string()
      .required()
      .trim()
      .valid(...nodeEnvValue),
    mongodbUrl: Joi.string()
      .trim()
      .required()
      .regex(/^mongodb([+a-z]+|):\/\//),
    redisUrl: Joi.string().trim(),
  })
);

export const config: IAppConfiguration = configLoader.getConfig();

export default config;
