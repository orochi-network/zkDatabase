import { Queue } from 'bullmq';
import { ZKDB_TRANSACTION_QUEUE } from '@zkdb/storage';
import { config } from './config';

// export new Queue perform singleton
export const transactionQueue = new Queue(ZKDB_TRANSACTION_QUEUE, {
  connection: { url: config.REDIS_URL },
});
