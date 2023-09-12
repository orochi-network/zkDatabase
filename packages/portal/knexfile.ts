import { Connector } from '@orochi-network/framework';
import type { Knex } from 'knex';
import appConfig from './src/helper/config';

// Update with your config settings.

const config: { [key: string]: Knex.Config } = {
  development: Connector.parseURL(appConfig.mariadbConnectUrl),
};

module.exports = config;
