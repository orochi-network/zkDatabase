import { LoggerLoader } from '@orochi-network/framework';
import { config } from './config.js';

export default new LoggerLoader(
  'zkDatabase',
  config.OROCHI_LOG,
  config.NODE_ENV === 'production' ? 'json' : 'string'
);
