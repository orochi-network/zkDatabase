import { logger } from '@helper';
import { ClusterApplication, LoggerSet } from '@orochi-network/framework';
import {
  SERVICE_COMPILE,
  SERVICE_TRANSACTION,
  SERVICE_TASK,
  SERVICE_ROLLUP,
  newServiceDocument,
} from '@service';
// Set logger
LoggerSet(logger);
// Init cluster application
const clusterApp = new ClusterApplication();

clusterApp
  .add(SERVICE_COMPILE)
  .add(SERVICE_TRANSACTION)
  .add(SERVICE_TASK)
  .add(SERVICE_ROLLUP)
  // TODO: Make num of workers configurable instead of hardcoding
  .add(newServiceDocument('1'))
  .add(newServiceDocument('2'))
  .start();
