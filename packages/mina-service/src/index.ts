import { logger } from '@helper';
import { ClusterApplication, LoggerSet } from '@orochi-network/framework';
import {
  SERVICE_COMPILE,
  SERVICE_TRANSACTION,
  SERVICE_OFFCHAIN_ROLLUP,
} from '@service';
import { newServiceDocument } from './service/document-worker';
// Set logger
LoggerSet(logger);
// Init cluster application
const clusterApp = new ClusterApplication();

clusterApp
  .add(SERVICE_COMPILE)
  .add(SERVICE_TRANSACTION)
  .add(SERVICE_OFFCHAIN_ROLLUP)
  .add(SERVICE_OFFCHAIN_ROLLUP)
  // TODO: Make num of workers configurable instead of hardcoding
  .add(newServiceDocument('1'))
  .add(newServiceDocument('2'))
  .start();
