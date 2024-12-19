import { Queue } from 'bullmq';
import config from './config';
import { ZKDB_TRANSACTION_QUEUE } from '@zkdb/storage';

// export new Queue perform singleton
export const transactionQueue = new Queue(ZKDB_TRANSACTION_QUEUE, {
  connection: { url: config.REDIS_URL },
});
