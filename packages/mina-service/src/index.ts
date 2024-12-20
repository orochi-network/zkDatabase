import { ClusterApplication } from '@orochi-network/framework';
import { SERVICE_COMPILE, TASK_SERVICE } from '@service';

const clusterApp = new ClusterApplication();

clusterApp.add(SERVICE_COMPILE).start();
clusterApp.add(TASK_SERVICE).start();
