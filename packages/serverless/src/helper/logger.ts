import { LoggerLoader } from '@orochi-network/framework';
import { config } from './config';

export const logger = new LoggerLoader(
  'zkDatabase',
  config.OROCHI_LOG,
  config.NODE_ENV === 'production' ? 'json' : 'string'
);

export default logger;
