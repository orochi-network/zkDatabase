import { ClusterApplication } from '@orochi-network/framework';
import { SERVICE_COMPILE } from '@service';

const clusterApp = new ClusterApplication();

clusterApp.add(SERVICE_COMPILE).start();
