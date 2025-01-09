import { logger } from '@helper';
import { ClusterApplication, LoggerSet } from '@orochi-network/framework';
import {
  SERVICE_COMPILE,
  SERVICE_TRANSACTION,
  SERVICE_TASK,
  SERVICE_ROLLUP,
  SERVICE_DOCUMENT,
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
  .add(SERVICE_DOCUMENT)
  .start();
