import {
  ConfigLoader,
  Singleton,
  Utilities,
  Validator,
} from '@orochi-network/framework';

interface IAppConfiguration {
  nodeEnv: string;
}

const configLoader = Singleton<ConfigLoader>(
  'orochi-backend',
  ConfigLoader,
  `${Utilities.File.getRootFolder()}/.env`,
  new Validator({
    name: 'nodeEnv',
    type: 'string',
    defaultValue: 'development',
    require: true,
    enums: ['development', 'production', 'staging'],
  })
);

export const config: IAppConfiguration = configLoader.getConfig();

export default config;
