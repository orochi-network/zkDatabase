import { logger } from '@helper';
import { ClusterApplication, LoggerSet } from '@orochi-network/framework';
import {
  SERVICE_COMPILE,
  SERVICE_TRANSACTION,
  SERVICE_OFFCHAIN_ROLLUP,
} from '@service';
// Set logger
LoggerSet(logger);
// Init cluster application
const clusterApp = new ClusterApplication();

clusterApp
  .add(SERVICE_COMPILE)
  .add(SERVICE_TRANSACTION)
  .add(SERVICE_OFFCHAIN_ROLLUP)
  .start();
