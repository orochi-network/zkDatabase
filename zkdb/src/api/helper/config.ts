import { fileURLToPath } from 'url';
import path from 'path';
import {
  ConfigLoader,
  Singleton,
  Utilities,
  Validator,
} from '@orochi-network/framework';

interface IAppConfiguration {
  nodeEnv: 'development' | 'production' | 'staging';
  hmacSecretKey: string;
  dataLocation: string;
}

export const envLocation = `${Utilities.File.getRootFolder(
  path.dirname(fileURLToPath(import.meta.url))
)}/.env`;

const configLoader = Singleton<ConfigLoader>(
  'orochi-backend',
  ConfigLoader,
  envLocation,
  new Validator(
    {
      name: 'nodeEnv',
      type: 'string',
      defaultValue: 'development',
      require: true,
      enums: ['development', 'production', 'staging'],
    },
    {
      name: 'hmacSecretKey',
      type: 'string',
      require: true,
      postProcess: (v: string) => v.trim(),
    },
    {
      name: 'dataLocation',
      type: 'string',
      require: false,
      postProcess: (v: string) => v.trim(),
    }
  )
);

export const config: IAppConfiguration = configLoader.getConfig();

export default config;
