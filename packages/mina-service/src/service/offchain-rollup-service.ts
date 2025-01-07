import amqp from 'amqplib';
import { config } from '@helper';
import { DatabaseEngine } from '@zkdb/storage';
import { QueueLoop, TimeDuration } from '@orochi-network/queue';

export const SERVICE_ROLLUP = {
  clusterName: 'offchain-rollup-queue',
  payload: async () => {
    // Connect to db
    const serverlessDb = DatabaseEngine.getInstance(config.MONGODB_URL);
    const proofDb = DatabaseEngine.getInstance(config.PROOF_MONGODB_URL);

    if (!serverlessDb.isConnected()) {
      await serverlessDb.connect();
    }

    if (!proofDb.isConnected()) {
      await proofDb.connect();
    }

    const queue = new QueueLoop();

    queue.add(
      'consume-offchain-rollup',
      async () => {
        // This is for consume message
        // Init abstract message queue protocol
        const connection = await amqp.connect('amqp://localhost');
        const channel = connection.createChannel();
      },
      TimeDuration.fromMinute(1)
    );
  },
};
