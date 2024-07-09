import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import { ConfigLoader, Singleton, Utilities } from '@orochi-network/framework';
import Joi from 'joi';

export const nodeEnvValue = ['development', 'production', 'staging'] as const;

type TNodeEnv = (typeof nodeEnvValue)[number];

interface IAppConfiguration {
  nodeEnv: TNodeEnv;
  aasUri: string
}

export const envLocation = `${Utilities.File.getRootFolder(
  path.dirname(fileURLToPath(pathToFileURL(__filename).toString()))
)}/packages/api/.env`;

const configLoader = Singleton<ConfigLoader>(
  'zkdb-api',
  ConfigLoader,
  envLocation,
  Joi.object<IAppConfiguration>({
    nodeEnv: Joi.string()
      .required()
      .trim()
      .valid(...nodeEnvValue),
    aasUri: Joi.string(),
  })
);

export const config: IAppConfiguration = configLoader.getConfig();

export default config;
