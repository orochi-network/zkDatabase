import { logger } from '@helper';
import { ClusterApplication, LoggerSet } from '@orochi-network/framework';
import { SERVICE_DOCUMENT } from '@service';
// Set logger
LoggerSet(logger);
// Init cluster application
const clusterApp = new ClusterApplication();

clusterApp.add(SERVICE_DOCUMENT).start();
